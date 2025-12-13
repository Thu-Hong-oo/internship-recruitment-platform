const { logger } = require('../../utils/logger');
const { getSentenceBertService } = require('./sentenceBertService');
const { getVectorStore } = require('./vectorStore');
const CandidateProfile = require('../../models/CandidateProfile');
const Job = require('../../models/Job');
const SavedJob = require('../../models/SavedJob');
const Application = require('../../models/Application');
const CVMatchingScore = require('../../models/CVMatchingScore');
const SearchLog = require('../../models/SearchLog');

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function yearsFromExperience(expArray = []) {
  const now = new Date();
  let months = 0;
  for (const exp of expArray) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.endDate ? new Date(exp.endDate) : now;
    if (start && !isNaN(start)) {
      months += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30.4));
    }
  }
  return +(months / 12).toFixed(1);
}

function calcExperienceScore(candidateYears, jobYears = 0) {
  if (!jobYears) return 70;
  const diff = Math.abs(candidateYears - jobYears);
  if (diff <= 1) return 100;
  if (diff <= 2) return 85;
  if (diff <= 4) return 70;
  return 50;
}

function calcEducationScore(candidateProfile, job) {
  const edu = candidateProfile.education || {};
  const major =
    edu.major ||
    edu.field ||
    edu.university?.major ||
    edu.university?.field ||
    '';
  const jobMajor = job.major || job.field || job.industry || '';
  if (major && jobMajor && major.toLowerCase().includes(jobMajor.toLowerCase())) {
    return 100;
  }
  if (major || jobMajor) return 70;
  return 50;
}

function haversineDistanceKm(loc1, loc2) {
  if (
    !loc1 ||
    !loc2 ||
    !Array.isArray(loc1.coordinates) ||
    !Array.isArray(loc2.coordinates)
  )
    return null;
  const [lng1, lat1] = loc1.coordinates;
  const [lng2, lat2] = loc2.coordinates;
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcLocationSalaryScore(candidateProfile, job, meta) {
  let score = 60;
  const distanceKm = haversineDistanceKm(
    candidateProfile.personalInfo?.location,
    meta?.location || job.location
  );
  if (distanceKm !== null) {
    if (distanceKm <= 10) score += 25;
    else if (distanceKm <= 30) score += 15;
    else if (distanceKm <= 50) score += 5;
    else score -= 10;
  }

  const desiredSalary =
    candidateProfile.personalInfo?.expectedSalary ||
    candidateProfile.personalInfo?.salaryExpectation ||
    0;
  const min = meta?.salaryMin || job.salaryMin || 0;
  const max = meta?.salaryMax || job.salaryMax || 0;

  if (desiredSalary && (min || max)) {
    const target = (min && max ? (min + max) / 2 : max || min) || 0;
    const diffRatio = Math.abs(desiredSalary - target) / (target || desiredSalary);
    if (diffRatio <= 0.1) score += 20;
    else if (diffRatio <= 0.3) score += 10;
    else score -= 10;
  }

  return clamp(score);
}

function buildCandidateText(profile) {
  const skills =
    profile.skills?.technical?.map(s => s.name || s) ||
    profile.skills?.soft?.map(s => s.name || s) ||
    [];
  const summary = profile.summary || profile.personalInfo?.summary || '';
  const exp = (profile.experience?.internships || [])
    .concat(profile.experience?.fullTime || [])
    .concat(profile.experience?.projects || [])
    .map(e => `${e.position || ''} ${e.company || ''} ${e.description || ''}`)
    .join(' ');

  return [skills.join(' '), summary, exp]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .substring(0, 2000);
}

function cosineSim(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return null;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    if (typeof va !== 'number' || typeof vb !== 'number') return null;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (!na || !nb) return null;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class FastMatcherService {
  constructor() {
    this.vectorStore = getVectorStore();
    this.sbert = getSentenceBertService();
  }

  async matchCandidate(candidateProfile, opts = {}) {
    const topN = opts.topN || 15;
    const vectorTopK = opts.vectorTopK || 60;
    const saveScores = opts.saveScores ?? true;

    try {
      logger.info('FastMatcher: Ensuring jobs are precomputed in ChromaDB...');
      await this.vectorStore.ensurePrecomputed();
      logger.info('FastMatcher: Jobs precomputed successfully');
    } catch (error) {
      logger.error('FastMatcher: Failed to ensure precomputed jobs:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }

    const text = buildCandidateText(candidateProfile);
    const embedding = await this.sbert.encode(text);

    const results = await this.vectorStore.queryTopN(embedding, vectorTopK);
    const ids = (results.ids && results.ids[0]) || [];
    const metas = (results.metadatas && results.metadatas[0]) || [];
    const distances = (results.distances && results.distances[0]) || [];
    const embedResults = (results.embeddings && results.embeddings[0]) || [];

    // Precompute usable distances (fallback to cosine from embeddings)
    const computedDistances = ids.map((id, idx) => {
      let dist = distances[idx];
      if (dist === undefined || dist === null) {
        const sim = cosineSim(embedding, embedResults[idx] || []);
        dist = sim !== null ? 1 - sim : 1;
      }
      return dist;
    });

    // Behavior signals: saved, applied, preferences
    const candidateId = candidateProfile._id || candidateProfile.id || candidateProfile.userId;
    const userId = candidateProfile.userId || candidateId;
    
    // Get saved/applied jobs
    const [savedDocs, appliedDocs] = await Promise.all([
      SavedJob.find({ candidateId }).select('jobId').lean(),
      Application.find({ candidateId }).select('jobId').lean(),
    ]);
    const savedSet = new Set(savedDocs.map(d => d.jobId?.toString()).filter(Boolean));
    const appliedSet = new Set(appliedDocs.map(d => d.jobId?.toString()).filter(Boolean));
    const prefJobIds = [...new Set([...savedSet, ...appliedSet])];
    const prefJobs = prefJobIds.length
      ? await Job.find({ _id: { $in: prefJobIds } })
          .select('industry jobType location')
          .lean()
      : [];

    // Get search history preferences (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const searchLogs = await SearchLog.find({
      $or: [{ userId }, { candidateId }],
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select('keyword filters')
      .lean();

    const topCount = (arr, limit = 3) => {
      const freq = new Map();
      arr.filter(Boolean).forEach(val => freq.set(val, (freq.get(val) || 0) + 1));
      return new Set(
        [...freq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([k]) => k)
      );
    };

    // Extract preferences from saved/applied jobs
    const prefIndustries = topCount(prefJobs.map(j => j.industry));
    const prefJobTypes = topCount(prefJobs.map(j => j.jobType));
    const prefLocations = topCount(
      prefJobs.map(j => (j.location?.city ? j.location.city : j.location))
    );

    // Extract preferences from search logs
    const searchKeywords = topCount(
      searchLogs.map(log => log.keyword).filter(Boolean),
      5
    );
    const searchIndustries = topCount(
      searchLogs.map(log => log.filters?.industry).filter(Boolean),
      3
    );
    const searchLocations = topCount(
      searchLogs.map(log => log.filters?.location).filter(Boolean),
      3
    );
    const searchJobTypes = topCount(
      searchLogs.map(log => log.filters?.jobType).filter(Boolean),
      2
    );

    // Merge preferences: saved/applied + search history (search history has lower weight)
    const allPrefIndustries = new Set([...prefIndustries, ...searchIndustries]);
    const allPrefJobTypes = new Set([...prefJobTypes, ...searchJobTypes]);
    const allPrefLocations = new Set([...prefLocations, ...searchLocations]);

    // Fetch actual jobs for detail scoring
    const jobs = await Job.find({ _id: { $in: ids } }).lean();
    const jobsById = new Map(jobs.map(j => [j._id.toString(), j]));

    const candidateYears = yearsFromExperience(
      (candidateProfile.experience?.internships || []).concat(
        candidateProfile.experience?.fullTime || []
      )
    );

    const minDist = computedDistances.length ? Math.min(...computedDistances) : 1;
    const maxDist = computedDistances.length ? Math.max(...computedDistances) : 1;
    const distRange = Math.max(maxDist - minDist, 1e-6);

    const scored = ids.map((id, idx) => {
      const job = jobsById.get(id);
      const meta = metas[idx] || {};
      const distance = computedDistances[idx] ?? 1;

      // Normalize distance to score 0-100 (best distance -> 100)
      const vectorScore = clamp(((maxDist - distance) / distRange) * 100);
      const expScore = calcExperienceScore(candidateYears, meta.yearsExp || job?.yearsOfExperience || 0);
      const eduScore = job ? calcEducationScore(candidateProfile, job) : 50;
      const locSalaryScore = job ? calcLocationSalaryScore(candidateProfile, job, meta) : 60;

      // Behavior score: boost saved/applied and preference match
      let behaviorScore = 0;
      if (savedSet.has(id)) behaviorScore += 12;
      if (appliedSet.has(id)) behaviorScore += 8;
      
      if (job) {
        // Boost from saved/applied job preferences (higher weight)
        if (prefIndustries.has(job.industry)) behaviorScore += 4;
        if (prefJobTypes.has(job.jobType)) behaviorScore += 3;
        const jobLoc = job.location?.city || job.location;
        if (prefLocations.has(jobLoc)) behaviorScore += 3;
        
        // Boost from search history preferences (lower weight)
        if (searchIndustries.has(job.industry)) behaviorScore += 2;
        if (searchJobTypes.has(job.jobType)) behaviorScore += 1.5;
        if (searchLocations.has(jobLoc)) behaviorScore += 1.5;
        
        // Boost if job title/description matches search keywords
        if (searchKeywords.size > 0) {
          const jobText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
          let keywordMatches = 0;
          for (const keyword of searchKeywords) {
            if (jobText.includes(keyword.toLowerCase())) {
              keywordMatches++;
            }
          }
          if (keywordMatches > 0) {
            behaviorScore += Math.min(keywordMatches * 1.5, 5); // Max 5 points for keywords
          }
        }
      }

      const finalScore = clamp(
        vectorScore * 0.5 +
          expScore * 0.18 +
          eduScore * 0.12 +
          locSalaryScore * 0.15 +
          behaviorScore * 1
      );

      return {
        jobId: id,
        finalScore: Math.round(finalScore),
        vectorScore: Math.round(vectorScore),
        expScore,
        eduScore,
        locSalaryScore,
        behaviorScore,
        meta,
      };
    });

    const top = scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, topN);

    if (saveScores) {
      const bulkOps = top.map(item => ({
        updateOne: {
          filter: {
            candidateId: candidateProfile.userId,
            jobId: item.jobId,
          },
          update: {
            $set: {
              candidateId: candidateProfile.userId,
              jobId: item.jobId,
              overallScore: item.finalScore, // Use overallScore to match model schema
              scoreBreakdown: {
                skillsScore: { score: item.vectorScore, weight: 0.5 },
                experienceScore: { score: item.expScore, weight: 0.2 },
                educationScore: { score: item.eduScore, weight: 0.15 },
                locationSalaryScore: { score: item.locSalaryScore, weight: 0.15 },
              },
              calculationMethod: 'vector-fast',
              calculatedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));
      await CVMatchingScore.bulkWrite(bulkOps, { ordered: false });
    }

    logger.info(
      `✅ Fast match calculated for candidate ${candidateProfile.userId}: ${top.length} results`
    );

    return top;
  }
}

let instance = null;
function getFastMatcherService() {
  if (!instance) instance = new FastMatcherService();
  return instance;
}

module.exports = { getFastMatcherService };

