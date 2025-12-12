const { logger } = require('../../utils/logger');
const { getSentenceBertService } = require('./sentenceBertService');
const { getVectorStore } = require('./vectorStore');
const CandidateProfile = require('../../models/CandidateProfile');
const Job = require('../../models/Job');
const CVMatchingScore = require('../../models/CVMatchingScore');

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

class FastMatcherService {
  constructor() {
    this.vectorStore = getVectorStore();
    this.sbert = getSentenceBertService();
  }

  async matchCandidate(candidateProfile, opts = {}) {
    const topN = opts.topN || 15;
    const vectorTopK = opts.vectorTopK || 60;
    const saveScores = opts.saveScores ?? true;

    await this.vectorStore.ensurePrecomputed();

    const text = buildCandidateText(candidateProfile);
    const embedding = await this.sbert.encode(text);

    const results = await this.vectorStore.queryTopN(embedding, vectorTopK);
    const ids = (results.ids && results.ids[0]) || [];
    const metas = (results.metadatas && results.metadatas[0]) || [];
    const distances = (results.distances && results.distances[0]) || [];

    // Fetch actual jobs for detail scoring
    const jobs = await Job.find({ _id: { $in: ids } }).lean();
    const jobsById = new Map(jobs.map(j => [j._id.toString(), j]));

    const candidateYears = yearsFromExperience(
      (candidateProfile.experience?.internships || []).concat(
        candidateProfile.experience?.fullTime || []
      )
    );

    const scored = ids.map((id, idx) => {
      const job = jobsById.get(id);
      const meta = metas[idx] || {};
      const distance = distances[idx] || 1;

      const vectorScore = clamp((1 - distance) * 100);
      const expScore = calcExperienceScore(candidateYears, meta.yearsExp || job?.yearsOfExperience || 0);
      const eduScore = job ? calcEducationScore(candidateProfile, job) : 50;
      const locSalaryScore = job ? calcLocationSalaryScore(candidateProfile, job, meta) : 60;

      const finalScore = clamp(
        vectorScore * 0.5 +
          expScore * 0.2 +
          eduScore * 0.15 +
          locSalaryScore * 0.15
      );

      return {
        jobId: id,
        finalScore: Math.round(finalScore),
        vectorScore: Math.round(vectorScore),
        expScore,
        eduScore,
        locSalaryScore,
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
              score: item.finalScore,
              vectorScore: item.vectorScore,
              experienceScore: item.expScore,
              educationScore: item.eduScore,
              locationSalaryScore: item.locSalaryScore,
              calculationMethod: 'vector-fast',
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

