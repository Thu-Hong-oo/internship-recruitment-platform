const CandidateRepository = require('../../repositories/CandidateRepository');
const CVRepository = require('../../repositories/CVRepository');
const CloudinaryService = require('../external/CloudinaryService');
const GeminiAIService = require('../external/GeminiAIService');
const QueueService = require('../external/QueueService');
const ValidationService = require('./ValidationService');
const EmailService = require('../external/EmailService');

class CandidateService {
  constructor() {
    this.candidateRepository = new CandidateRepository();
    this.cvRepository = new CVRepository();
    this.validationService = new ValidationService();
  }

  async createProfile(userId, profileData) {
    try {
      // Validate profile data
      const validation = this.validationService.validateProfile(profileData);
      if (!validation.isValid) {
        throw new Error(
          `Profile validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Check if candidate already exists
      const existingCandidate = await this.candidateRepository.findByUserId(
        userId
      );
      if (existingCandidate) {
        throw new Error('Candidate profile already exists');
      }

      // Create candidate profile
      const candidateData = {
        userId,
        ...profileData,
        profileCompleteness: 0,
      };

      const candidate = await this.candidateRepository.create(candidateData);

      // Calculate initial profile completeness
      const completeness = candidate.calculateProfileCompleteness();
      await this.candidateRepository.update(candidate._id, {
        profileCompleteness: completeness,
      });

      // Send welcome email
      await EmailService.sendWelcomeEmail(candidate.userId.email, 'candidate');

      return {
        success: true,
        candidate: {
          id: candidate._id,
          userId: candidate.userId,
          fullName: candidate.fullName,
          profileCompleteness: completeness,
        },
        message: 'Candidate profile created successfully',
      };
    } catch (error) {
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  async updateProfile(candidateId, updates) {
    try {
      // Validate updates
      const validation = this.validationService.validateProfile(updates);
      if (!validation.isValid) {
        throw new Error(
          `Profile validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update candidate profile
      const updatedCandidate = await this.candidateRepository.updateProfile(
        candidateId,
        updates
      );

      // Recalculate profile completeness
      const completeness = updatedCandidate.calculateProfileCompleteness();
      await this.candidateRepository.update(candidateId, {
        profileCompleteness: completeness,
      });

      return {
        success: true,
        candidate: {
          id: updatedCandidate._id,
          fullName: updatedCandidate.fullName,
          profileCompleteness: completeness,
        },
        message: 'Profile updated successfully',
      };
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  async uploadCV(candidateId, file) {
    try {
      // Validate file
      CloudinaryService.validateFile(file);

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        file.buffer,
        `smart-recruitment/cvs/${candidateId}`,
        {
          resource_type: 'auto',
          quality: 'auto',
        }
      );

      // Create CV record
      const cvData = {
        candidateId,
        originalName: file.originalname,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileSize: file.size,
        mimeType: file.mimetype,
        isActive: true,
        isDefault: false,
        analysisStatus: 'pending',
      };

      const cv = await this.cvRepository.create(cvData);

      // Queue CV analysis
      await QueueService.addJob('cv-analysis', 'analyze-cv', {
        cvId: cv._id,
        candidateId,
      });

      return {
        success: true,
        cv: {
          id: cv._id,
          originalName: cv.originalName,
          cloudinaryUrl: cv.cloudinaryUrl,
          fileSize: cv.fileSize,
          analysisStatus: cv.analysisStatus,
        },
        message: 'CV uploaded successfully. Analysis in progress.',
      };
    } catch (error) {
      throw new Error(`CV upload failed: ${error.message}`);
    }
  }

  async setDefaultCV(candidateId, cvId) {
    try {
      // Verify CV belongs to candidate
      const cv = await this.cvRepository.findById(cvId);
      if (!cv || cv.candidateId.toString() !== candidateId) {
        throw new Error('CV not found or does not belong to candidate');
      }

      // Set as default CV
      const updatedCV = await this.cvRepository.setAsDefault(cvId);

      return {
        success: true,
        cv: {
          id: updatedCV._id,
          isDefault: updatedCV.isDefault,
        },
        message: 'Default CV set successfully',
      };
    } catch (error) {
      throw new Error(`Set default CV failed: ${error.message}`);
    }
  }

  async getCVs(candidateId) {
    try {
      const cvs = await this.cvRepository.findByCandidate(candidateId);

      return {
        success: true,
        cvs: cvs.map(cv => ({
          id: cv._id,
          originalName: cv.originalName,
          cloudinaryUrl: cv.cloudinaryUrl,
          fileSize: cv.fileSize,
          isDefault: cv.isDefault,
          analysisStatus: cv.analysisStatus,
          uploadedAt: cv.uploadedAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get CVs failed: ${error.message}`);
    }
  }

  async deleteCV(candidateId, cvId) {
    try {
      // Verify CV belongs to candidate
      const cv = await this.cvRepository.findById(cvId);
      if (!cv || cv.candidateId.toString() !== candidateId) {
        throw new Error('CV not found or does not belong to candidate');
      }

      // Delete from Cloudinary
      await CloudinaryService.deleteFile(cv.cloudinaryPublicId);

      // Delete CV record
      await this.cvRepository.deleteCV(cvId);

      return {
        success: true,
        message: 'CV deleted successfully',
      };
    } catch (error) {
      throw new Error(`CV deletion failed: ${error.message}`);
    }
  }

  async analyzeCV(cvId) {
    try {
      const cv = await this.cvRepository.findById(cvId);
      if (!cv) {
        throw new Error('CV not found');
      }

      if (cv.analysisStatus === 'completed') {
        const analysis = await this.cvRepository.getAnalysisByCV(cvId);
        return {
          success: true,
          analysis: {
            skills: analysis.skills,
            experience: analysis.experience,
            education: analysis.education,
            summary: analysis.summary,
            confidenceScore: analysis.confidenceScore,
          },
        };
      }

      // Queue analysis if not completed
      await QueueService.addJob('cv-analysis', 'analyze-cv', {
        cvId: cv._id,
        candidateId: cv.candidateId,
      });

      return {
        success: true,
        message: 'CV analysis queued',
      };
    } catch (error) {
      throw new Error(`CV analysis failed: ${error.message}`);
    }
  }

  async getProfileCompleteness(candidateId) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const completeness = candidate.calculateProfileCompleteness();

      return {
        success: true,
        completeness,
        isComplete: completeness >= 80,
      };
    } catch (error) {
      throw new Error(
        `Profile completeness calculation failed: ${error.message}`
      );
    }
  }

  async addEducation(candidateId, education) {
    try {
      const updatedCandidate = await this.candidateRepository.addEducation(
        candidateId,
        education
      );

      // Recalculate profile completeness
      const completeness = updatedCandidate.calculateProfileCompleteness();
      await this.candidateRepository.update(candidateId, {
        profileCompleteness: completeness,
      });

      return {
        success: true,
        candidate: {
          id: updatedCandidate._id,
          profileCompleteness: completeness,
        },
        message: 'Education added successfully',
      };
    } catch (error) {
      throw new Error(`Add education failed: ${error.message}`);
    }
  }

  async addExperience(candidateId, experience) {
    try {
      const updatedCandidate = await this.candidateRepository.addExperience(
        candidateId,
        experience
      );

      // Recalculate profile completeness
      const completeness = updatedCandidate.calculateProfileCompleteness();
      await this.candidateRepository.update(candidateId, {
        profileCompleteness: completeness,
      });

      return {
        success: true,
        candidate: {
          id: updatedCandidate._id,
          profileCompleteness: completeness,
        },
        message: 'Experience added successfully',
      };
    } catch (error) {
      throw new Error(`Add experience failed: ${error.message}`);
    }
  }

  async updateSkills(candidateId, skills) {
    try {
      const updatedCandidate = await this.candidateRepository.updateSkills(
        candidateId,
        skills
      );

      // Recalculate profile completeness
      const completeness = updatedCandidate.calculateProfileCompleteness();
      await this.candidateRepository.update(candidateId, {
        profileCompleteness: completeness,
      });

      return {
        success: true,
        candidate: {
          id: updatedCandidate._id,
          skills: updatedCandidate.skills,
          profileCompleteness: completeness,
        },
        message: 'Skills updated successfully',
      };
    } catch (error) {
      throw new Error(`Update skills failed: ${error.message}`);
    }
  }

  async searchCandidates(filters) {
    try {
      const candidates = await this.candidateRepository.searchCandidates(
        filters
      );

      return {
        success: true,
        candidates: candidates.map(candidate => ({
          id: candidate._id,
          fullName: candidate.fullName,
          headline: candidate.headline,
          location: candidate.location,
          skills: candidate.skills,
          profileCompleteness: candidate.profileCompleteness,
          hasResume: candidate.hasResume(),
        })),
        total: candidates.length,
      };
    } catch (error) {
      throw new Error(`Search candidates failed: ${error.message}`);
    }
  }

  async getCandidateProfile(candidateId) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      return {
        success: true,
        candidate: {
          id: candidate._id,
          fullName: candidate.fullName,
          headline: candidate.headline,
          bio: candidate.bio,
          location: candidate.location,
          education: candidate.education,
          experience: candidate.experience,
          skills: candidate.skills,
          profileCompleteness: candidate.profileCompleteness,
          hasResume: candidate.hasResume(),
        },
      };
    } catch (error) {
      throw new Error(`Get candidate profile failed: ${error.message}`);
    }
  }

  async getCandidateStats(candidateId) {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const cvs = await this.cvRepository.findByCandidate(candidateId);
      const defaultCV = await this.cvRepository.getDefaultCV(candidateId);

      return {
        success: true,
        stats: {
          profileCompleteness: candidate.profileCompleteness,
          cvCount: cvs.length,
          hasDefaultCV: !!defaultCV,
          skillsCount: candidate.skills ? candidate.skills.length : 0,
          experienceCount: candidate.experience
            ? candidate.experience.length
            : 0,
          educationCount: candidate.education ? candidate.education.length : 0,
        },
      };
    } catch (error) {
      throw new Error(`Get candidate stats failed: ${error.message}`);
    }
  }
}

module.exports = new CandidateService();
