// AI Job Recommendation System
const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');

class JobRecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.jobEmbeddings = new Map();
    this.similarityMatrix = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize TensorFlow
      await tf.ready();
      
      // Load pre-trained embeddings or train new ones
      await this.loadJobEmbeddings();
      
      this.isInitialized = true;
      console.log('✅ Job Recommendation Engine initialized');
    } catch (error) {
      console.error('❌ Job Recommendation Engine initialization failed:', error);
    }
  }

  async loadJobEmbeddings() {
    // In a real implementation, you would load pre-trained embeddings
    // For now, we'll create simple TF-IDF based embeddings
    this.tfidf = new natural.TfIdf();
  }

  // Content-based filtering
  async getContentBasedRecommendations(userId, jobs, limit = 10) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      return this.getPopularJobs(jobs, limit);
    }

    const recommendations = [];
    
    for (const job of jobs) {
      const score = this.calculateContentSimilarity(userProfile, job);
      recommendations.push({
        jobId: job._id,
        score: score,
        method: 'content-based',
        reasons: this.getRecommendationReasons(userProfile, job)
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Collaborative filtering
  async getCollaborativeRecommendations(userId, jobs, applications, limit = 10) {
    const similarUsers = this.findSimilarUsers(userId, applications);
    const recommendations = new Map();

    for (const similarUser of similarUsers) {
      const userApplications = applications.filter(app => 
        app.jobseekerId.toString() === similarUser.userId
      );

      for (const application of userApplications) {
        const job = jobs.find(j => j._id.toString() === application.jobId.toString());
        if (job && application.status === 'accepted') {
          const currentScore = recommendations.get(job._id) || 0;
          recommendations.set(job._id, currentScore + similarUser.similarity);
        }
      }
    }

    return Array.from(recommendations.entries())
      .map(([jobId, score]) => ({
        jobId: jobId,
        score: score,
        method: 'collaborative',
        reasons: ['Similar users liked this job']
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Hybrid recommendation
  async getHybridRecommendations(userId, jobs, applications, limit = 10) {
    const contentBased = await this.getContentBasedRecommendations(userId, jobs, limit * 2);
    const collaborative = await this.getCollaborativeRecommendations(userId, jobs, applications, limit * 2);

    // Combine and re-rank
    const combined = new Map();

    // Add content-based recommendations
    contentBased.forEach(rec => {
      combined.set(rec.jobId, {
        jobId: rec.jobId,
        contentScore: rec.score,
        collaborativeScore: 0,
        finalScore: rec.score * 0.6, // 60% weight
        reasons: rec.reasons
      });
    });

    // Add collaborative recommendations
    collaborative.forEach(rec => {
      if (combined.has(rec.jobId)) {
        const existing = combined.get(rec.jobId);
        existing.collaborativeScore = rec.score;
        existing.finalScore += rec.score * 0.4; // 40% weight
        existing.reasons.push(...rec.reasons);
      } else {
        combined.set(rec.jobId, {
          jobId: rec.jobId,
          contentScore: 0,
          collaborativeScore: rec.score,
          finalScore: rec.score * 0.4,
          reasons: rec.reasons
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);
  }

  // Update user profile based on interactions
  updateUserProfile(userId, interactions) {
    const profile = {
      skills: new Set(),
      locations: new Set(),
      companies: new Set(),
      jobTypes: new Set(),
      salaryRange: { min: 0, max: 0 },
      interactions: []
    };

    interactions.forEach(interaction => {
      if (interaction.job) {
        // Extract skills
        if (interaction.job.skills) {
          interaction.job.skills.forEach(skill => profile.skills.add(skill));
        }

        // Extract location
        if (interaction.job.location?.city) {
          profile.locations.add(interaction.job.location.city);
        }

        // Extract company
        if (interaction.job.company) {
          profile.companies.add(interaction.job.company);
        }

        // Extract job type
        if (interaction.job.type) {
          profile.jobTypes.add(interaction.job.type);
        }

        // Extract salary
        if (interaction.job.salary) {
          if (interaction.job.salary.min > 0) {
            profile.salaryRange.min = Math.max(profile.salaryRange.min, interaction.job.salary.min);
          }
          if (interaction.job.salary.max > 0) {
            profile.salaryRange.max = Math.max(profile.salaryRange.max, interaction.job.salary.max);
          }
        }

        // Store interaction
        profile.interactions.push({
          jobId: interaction.job._id,
          type: interaction.type, // 'view', 'apply', 'save', 'like'
          timestamp: interaction.timestamp,
          weight: this.getInteractionWeight(interaction.type)
        });
      }
    });

    // Convert sets to arrays
    profile.skills = Array.from(profile.skills);
    profile.locations = Array.from(profile.locations);
    profile.companies = Array.from(profile.companies);
    profile.jobTypes = Array.from(profile.jobTypes);

    this.userProfiles.set(userId, profile);
    return profile;
  }

  calculateContentSimilarity(userProfile, job) {
    let score = 0;

    // Skills matching (40% weight)
    if (userProfile.skills && job.skills) {
      const skillMatches = userProfile.skills.filter(skill =>
        job.skills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(jobSkill.toLowerCase())
        )
      );
      score += (skillMatches.length / Math.max(userProfile.skills.length, 1)) * 0.4;
    }

    // Location matching (25% weight)
    if (userProfile.locations && job.location?.city) {
      const locationMatch = userProfile.locations.some(location =>
        location.toLowerCase() === job.location.city.toLowerCase()
      );
      score += locationMatch ? 0.25 : 0;
    }

    // Company preference (15% weight)
    if (userProfile.companies && job.company) {
      const companyMatch = userProfile.companies.some(company =>
        company.toLowerCase() === job.company.toLowerCase()
      );
      score += companyMatch ? 0.15 : 0;
    }

    // Job type preference (10% weight)
    if (userProfile.jobTypes && job.type) {
      const typeMatch = userProfile.jobTypes.includes(job.type);
      score += typeMatch ? 0.1 : 0;
    }

    // Salary range matching (10% weight)
    if (userProfile.salaryRange && job.salary) {
      const salaryMatch = this.calculateSalaryMatch(userProfile.salaryRange, job.salary);
      score += salaryMatch * 0.1;
    }

    return score;
  }

  findSimilarUsers(userId, applications) {
    const userApplications = applications.filter(app => 
      app.jobseekerId.toString() === userId
    );

    const similarUsers = [];
    const userJobIds = new Set(userApplications.map(app => app.jobId.toString()));

    // Group applications by user
    const userGroups = new Map();
    applications.forEach(app => {
      if (app.jobseekerId.toString() !== userId) {
        const userId = app.jobseekerId.toString();
        if (!userGroups.has(userId)) {
          userGroups.set(userId, []);
        }
        userGroups.get(userId).push(app);
      }
    });

    // Calculate similarity with each user
    userGroups.forEach((userApps, otherUserId) => {
      const otherUserJobIds = new Set(userApps.map(app => app.jobId.toString()));
      
      // Jaccard similarity
      const intersection = new Set([...userJobIds].filter(x => otherUserJobIds.has(x)));
      const union = new Set([...userJobIds, ...otherUserJobIds]);
      const similarity = intersection.size / union.size;

      if (similarity > 0.1) { // Minimum similarity threshold
        similarUsers.push({
          userId: otherUserId,
          similarity: similarity,
          commonJobs: Array.from(intersection)
        });
      }
    });

    return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  getRecommendationReasons(userProfile, job) {
    const reasons = [];

    // Skills match
    if (userProfile.skills && job.skills) {
      const skillMatches = userProfile.skills.filter(skill =>
        job.skills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (skillMatches.length > 0) {
        reasons.push(`Matches your skills: ${skillMatches.join(', ')}`);
      }
    }

    // Location match
    if (userProfile.locations && job.location?.city) {
      const locationMatch = userProfile.locations.some(location =>
        location.toLowerCase() === job.location.city.toLowerCase()
      );
      if (locationMatch) {
        reasons.push(`Located in your preferred area: ${job.location.city}`);
      }
    }

    // Company match
    if (userProfile.companies && job.company) {
      const companyMatch = userProfile.companies.some(company =>
        company.toLowerCase() === job.company.toLowerCase()
      );
      if (companyMatch) {
        reasons.push(`From a company you're interested in: ${job.company}`);
      }
    }

    return reasons;
  }

  getInteractionWeight(interactionType) {
    const weights = {
      'view': 1,
      'save': 3,
      'apply': 5,
      'like': 2,
      'share': 2
    };
    return weights[interactionType] || 1;
  }

  calculateSalaryMatch(userRange, jobSalary) {
    if (!userRange.min && !userRange.max) return 0.5;
    if (!jobSalary.min && !jobSalary.max) return 0.5;

    const userMid = (userRange.min + userRange.max) / 2;
    const jobMid = (jobSalary.min + jobSalary.max) / 2;

    const difference = Math.abs(userMid - jobMid) / userMid;
    return Math.max(0, 1 - difference);
  }

  getPopularJobs(jobs, limit = 10) {
    return jobs
      .sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
      .slice(0, limit)
      .map(job => ({
        jobId: job._id,
        score: job.stats?.views || 0,
        method: 'popular',
        reasons: ['Popular job with many views']
      }));
  }

  // Get recommendation explanation
  getRecommendationExplanation(userId, jobId, method) {
    const explanations = {
      'content-based': 'Based on your skills, location preferences, and past interactions',
      'collaborative': 'Similar users with your profile liked this job',
      'hybrid': 'Combined analysis of your preferences and similar users',
      'popular': 'This job is popular among many users'
    };

    return explanations[method] || 'Recommended based on our AI analysis';
  }
}

// Initialize singleton instance
const recommendationEngine = new JobRecommendationEngine();

// Initialize on module load
recommendationEngine.initialize().catch(console.error);

module.exports = {
  getContentBasedRecommendations: (userId, jobs, limit) => 
    recommendationEngine.getContentBasedRecommendations(userId, jobs, limit),
  getCollaborativeRecommendations: (userId, jobs, applications, limit) => 
    recommendationEngine.getCollaborativeRecommendations(userId, jobs, applications, limit),
  getHybridRecommendations: (userId, jobs, applications, limit) => 
    recommendationEngine.getHybridRecommendations(userId, jobs, applications, limit),
  updateUserProfile: (userId, interactions) => 
    recommendationEngine.updateUserProfile(userId, interactions),
  getRecommendationExplanation: (userId, jobId, method) => 
    recommendationEngine.getRecommendationExplanation(userId, jobId, method),
  JobRecommendationEngine
};
