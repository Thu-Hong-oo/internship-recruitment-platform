const mongoose = require('mongoose');
const CandidateProfile = require('../../models/CandidateProfile');
const aiService = require('../../services/ai/aiService');
const pdfGenerationService = require('../../services/resume/pdfGenerationService');
const resumeGeneratorService = require('../../services/resume/resumeGeneratorService');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');
const { uploadImage } = require('../../services/upload/imageUploadService');
const { logger } = require('../../utils/logger');

/**
 * CVBuilderController
 *
 * Chức năng chính:
 * - Quản lý dữ liệu CV builder
 * - Generate CV với templates
 * - Export PDF
 * - Quản lý templates
 *
 * Note: Các tính năng AI (analyze, match, suggestions)
 * đã được chuyển sang AIController để tránh trùng lắp
 */
class CVBuilderController {
  constructor() {
    // Core CV Builder
    this.getBuilderData = this.getBuilderData.bind(this);
    this.updateBuilderData = this.updateBuilderData.bind(this);

    // CV Generation
    this.generateSmartCV = this.generateSmartCV.bind(this);
    this.createCVFromTemplate = this.createCVFromTemplate.bind(this);
    this.getResumeById = this.getResumeById.bind(this);
    this.getDefaultResume = this.getDefaultResume.bind(this);

    // Templates
    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplateById = this.getTemplateById.bind(this);

    // PDF Export
    this.exportPDF = this.exportPDF.bind(this);
    this.exportPDFDirect = this.exportPDFDirect.bind(this);

    // CV History Management
    this.getCVHistory = this.getCVHistory.bind(this);
    this.deleteCVFromHistory = this.deleteCVFromHistory.bind(this);
    this.setCurrentCV = this.setCurrentCV.bind(this);

    // Avatar Upload
    this.uploadAvatar = this.uploadAvatar.bind(this);
  }

  // ========================================
  // CV BUILDER DATA MANAGEMENT
  // ========================================

  /**
   * GET /api/candidates/me/cv-builder
   * Lấy dữ liệu CV builder hiện tại
   */
  async getBuilderData(req, res, next) {
    try {
      const profile = await CandidateProfile.findOne({ userId: req.user.id });

      if (!profile) {
        return ApiResponse.success(
          res,
          this.getEmptyBuilderData(),
          'CV builder data retrieved'
        );
      }

      const builderData = {
        personalInfo: {
          fullName: profile.personalInfo?.fullName || '',
          email: req.user.email || profile.personalInfo?.email || '',
          phone: profile.personalInfo?.phone || '',
          address: this.formatAddress(profile.personalInfo?.address) || '',
          dateOfBirth: profile.personalInfo?.dateOfBirth || null,
          avatar: profile.personalInfo?.avatar || null,
          website: profile.personalInfo?.website || '',
          linkedin: profile.personalInfo?.linkedin || '',
          github: profile.personalInfo?.github || '',
          jobTitle: profile.personalInfo?.jobTitle || '',
        },
        targetJob: profile.targetJob || {
          title: '',
          industry: '',
          level: 'entry',
          salary: '',
          location: '',
        },
        careerObjective: profile.personalInfo?.bio || '',
        experience: this.formatExperience(profile.experience),
        education: this.formatEducation(profile.education),
        skills: this.formatSkills(profile.skills),
        projects: this.formatProjects(profile.projects),
        certifications: this.formatCertifications(profile.certifications),
        awards: this.formatAwards(profile.awards),
        languages: this.formatLanguages(profile.skills?.languages),
        hobbies: profile.hobbies || [],
        references: profile.references || [],
      };

      return ApiResponse.success(
        res,
        builderData,
        'CV builder data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/cv-builder
   * Cập nhật dữ liệu CV builder
   */
  async updateBuilderData(req, res, next) {
    try {
      const {
        personalInfo,
        targetJob,
        careerObjective,
        experience = [],
        education = [],
        skills = {},
        projects = [],
        certifications = [],
        awards = [],
        languages = [],
        hobbies = [],
        references = [],
      } = req.body;

      // Debug log để kiểm tra data nhận được
      console.log('📥 Received updateBuilderData:', {
        experienceCount: experience.length,
        experienceSample: experience[0],
        educationCount: education.length,
        educationSample: education[0],
        projectsCount: projects.length,
        certificationsCount: certifications.length,
        awardsCount: awards.length,
        hobbiesCount: hobbies.length,
        jobTitle: personalInfo?.jobTitle,
      });

      let profile = await CandidateProfile.findOne({ userId: req.user.id });

      if (!profile) {
        profile = new CandidateProfile({
          userId: req.user.id,
          personalInfo: {},
          progress: { profileCompleteness: 0, lastUpdated: new Date() },
          status: 'active',
        });
      }

      // Update personal info
      if (personalInfo) {
        // Build personalInfo object, only including fields that are explicitly provided
        // Start with existing personalInfo, but filter out undefined values
        const existingPersonalInfo = profile.personalInfo || {};
        const updatedPersonalInfo = {
          fullName:
            personalInfo.fullName !== undefined
              ? personalInfo.fullName || ''
              : existingPersonalInfo.fullName || '',
          email:
            personalInfo.email !== undefined
              ? personalInfo.email || ''
              : existingPersonalInfo.email || '',
          phone:
            personalInfo.phone !== undefined
              ? personalInfo.phone || ''
              : existingPersonalInfo.phone || '',
          dateOfBirth:
            personalInfo.dateOfBirth !== undefined
              ? personalInfo.dateOfBirth || null
              : existingPersonalInfo.dateOfBirth || null,
          avatar:
            personalInfo.avatar !== undefined
              ? personalInfo.avatar || null
              : existingPersonalInfo.avatar || null,
          website:
            personalInfo.website !== undefined
              ? personalInfo.website || ''
              : existingPersonalInfo.website || '',
          linkedin:
            personalInfo.linkedin !== undefined
              ? personalInfo.linkedin || ''
              : existingPersonalInfo.linkedin || '',
          github:
            personalInfo.github !== undefined
              ? personalInfo.github || ''
              : existingPersonalInfo.github || '',
          jobTitle:
            personalInfo.jobTitle !== undefined
              ? personalInfo.jobTitle || ''
              : existingPersonalInfo.jobTitle || '',
          bio:
            careerObjective !== undefined
              ? careerObjective || ''
              : existingPersonalInfo.bio || '',
        };

        // Handle address field carefully to avoid undefined
        // Only set address if it's explicitly provided in the request
        if (personalInfo.address !== undefined) {
          if (personalInfo.address === null || personalInfo.address === '') {
            updatedPersonalInfo.address = null;
          } else if (typeof personalInfo.address === 'string') {
            // Convert string to object format
            const addressString = personalInfo.address.trim();
            if (addressString) {
              updatedPersonalInfo.address = {
                street: '',
                ward: '',
                district: '',
                city: addressString,
                country: 'Vietnam',
              };
            } else {
              updatedPersonalInfo.address = null;
            }
          } else if (
            typeof personalInfo.address === 'object' &&
            personalInfo.address !== null
          ) {
            // Already an object, use it directly
            updatedPersonalInfo.address = personalInfo.address;
          } else {
            // Invalid type, set to null
            updatedPersonalInfo.address = null;
          }
        } else {
          // address not provided in request, keep existing value (but ensure it's not undefined)
          if (existingPersonalInfo.address !== undefined) {
            updatedPersonalInfo.address = existingPersonalInfo.address;
          } else {
            updatedPersonalInfo.address = null;
          }
        }

        profile.personalInfo = updatedPersonalInfo;
      }

      // Update target job
      if (targetJob) {
        profile.targetJob = targetJob;
      }

      // Update experience (luôn update, kể cả khi array rỗng để cho phép xóa)
      profile.experience = {
        internships: this.filterExperienceByType(experience, 'internship'),
        fulltime: this.filterExperienceByType(experience, 'fulltime'),
        parttime: this.filterExperienceByType(experience, 'parttime'),
        freelance: this.filterExperienceByType(experience, 'freelance'),
      };

      // Update education - lưu tất cả education items (luôn update, kể cả khi array rỗng)
      // Parse startYear và endYear từ string sang number nếu cần
      const parseYear = yearStr => {
        // Nếu là empty string hoặc falsy, return null
        if (!yearStr || yearStr === '') return null;
        if (typeof yearStr === 'number') return yearStr;
        // Extract year from "YYYY" or "YYYY-MM" format
        const yearMatch = String(yearStr)
          .trim()
          .match(/^(\d{4})/);
        return yearMatch ? parseInt(yearMatch[1], 10) : null;
      };

      console.log(
        '📚 Education data received:',
        JSON.stringify(education, null, 2)
      );

      if (education.length > 0) {
        // Lưu university đầu tiên vào education.university (để tương thích)
        const university =
          education.find(edu => edu.type === 'university') || education[0];
        if (university) {
          const uniStartYear = parseYear(university.startYear);
          const uniEndYear = parseYear(university.endYear);
          const uniStartDate = uniStartYear
            ? new Date(uniStartYear, 0, 1)
            : null;
          const uniEndDate = uniEndYear ? new Date(uniEndYear, 11, 31) : null;

          profile.education.university = {
            _id: university._id || new mongoose.Types.ObjectId(),
            institution: university.institution || '',
            degree: university.degree || '',
            field: university.field || '',
            startDate: uniStartDate,
            endDate: uniEndDate,
            startYear: uniStartYear, // Lưu thêm để tương thích
            endYear: uniEndYear, // Lưu thêm để tương thích
            graduationYear: uniEndYear,
            gpa: university.gpa || null,
            achievements: university.achievements || [],
            coursework: university.coursework || [],
          };
        }

        // Lưu highSchool nếu có
        const highSchool = education.find(edu => edu.type === 'highschool');
        if (highSchool) {
          profile.education.highSchool = {
            _id: highSchool._id || new mongoose.Types.ObjectId(),
            school: highSchool.institution,
            graduationYear: parseYear(highSchool.endYear),
            gpa: highSchool.gpa,
            achievements: highSchool.achievements || [],
          };
        }
      } else {
        // Nếu education array rỗng, xóa university và highSchool
        profile.education.university = null;
        profile.education.highSchool = null;
      }

      // Lưu tất cả education items vào education.certifications array (luôn update)
      // Note: Tên "certifications" không đúng mục đích, nhưng dùng tạm để lưu nhiều education items
      // Schema có startDate/endDate (Date) và graduationYear (Number), không có startYear/endYear
      profile.education.certifications = education.map(edu => {
        const startYear = parseYear(edu.startYear);
        const endYear = parseYear(edu.endYear);

        // Convert year (number) sang Date object cho startDate/endDate
        const startDate = startYear ? new Date(startYear, 0, 1) : null; // January 1st of the year
        const endDate = endYear ? new Date(endYear, 11, 31) : null; // December 31st of the year

        return {
          _id: edu._id || new mongoose.Types.ObjectId(),
          type: edu.type || 'university',
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          startDate: startDate,
          endDate: endDate,
          graduationYear: endYear, // Lưu number vào graduationYear
          gpa: edu.gpa || null,
          achievements: edu.achievements || [],
          coursework: edu.coursework || [],
        };
      });

      // Update skills
      if (skills.technical) {
        profile.skills.technical = skills.technical.map(skill => ({
          _id: skill._id || new mongoose.Types.ObjectId(),
          name: skill.name,
          level: skill.level || 'intermediate',
          verified: skill.verified || false,
          yearsOfExperience: skill.yearsOfExperience || 0,
        }));
      }

      if (skills.soft) {
        profile.skills.soft = skills.soft.map(skill => ({
          _id: skill._id || new mongoose.Types.ObjectId(),
          name: skill.name,
          level: skill.level || 'intermediate',
        }));
      }

      if (skills.languages) {
        profile.skills.languages = skills.languages.map(lang => ({
          _id: lang._id || new mongoose.Types.ObjectId(),
          language: lang.name || lang.language,
          level: lang.level,
          certification: lang.certification || null,
        }));
      }

      // Update projects (luôn update, kể cả khi array rỗng để cho phép xóa)
      // Parse date từ string sang Date object nếu cần
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr === '') return null;
        if (dateStr instanceof Date) return dateStr;
        // Nếu là string "YYYY-MM" hoặc "YYYY", parse thành Date
        if (typeof dateStr === 'string') {
          const dateMatch = dateStr.trim().match(/^(\d{4})(?:-(\d{2}))?/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = dateMatch[2] ? parseInt(dateMatch[2], 10) - 1 : 0; // Month is 0-indexed
            return new Date(year, month, 1);
          }
          // Try to parse as ISO date
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
      };

      profile.projects = projects.map(project => ({
        _id: project._id || new mongoose.Types.ObjectId(),
        title: project.title || '',
        description: project.description || '',
        technologies: project.technologies || [],
        startDate: parseDate(project.startDate),
        endDate: parseDate(project.endDate),
        status: project.status || 'completed',
        url: project.url || null,
        github: project.github || null,
        achievements: project.achievements || [],
      }));

      // Update certifications (luôn update, kể cả khi array rỗng để cho phép xóa)
      // Parse date từ string sang Date object nếu cần
      const parseCertDate = (dateStr) => {
        if (!dateStr || dateStr === '') return null;
        if (dateStr instanceof Date) return dateStr;
        // Nếu là string "YYYY-MM-DD" hoặc "YYYY-MM" hoặc "YYYY", parse thành Date
        if (typeof dateStr === 'string') {
          const dateMatch = dateStr.trim().match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            const month = dateMatch[2] ? parseInt(dateMatch[2], 10) - 1 : 0; // Month is 0-indexed
            const day = dateMatch[3] ? parseInt(dateMatch[3], 10) : 1;
            return new Date(year, month, day);
          }
          // Try to parse as ISO date
          const parsed = new Date(dateStr);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
      };

      profile.certifications = certifications.map(cert => ({
        _id: cert._id || new mongoose.Types.ObjectId(),
        name: cert.name || '',
        issuer: cert.issuer || '',
        issueDate: parseCertDate(cert.issueDate),
        expiryDate: parseCertDate(cert.expiryDate),
        credentialId: cert.credentialId || null,
        url: cert.url || null,
      }));

      // Update awards (luôn update, kể cả khi array rỗng để cho phép xóa)
      // Parse date từ string sang Date object nếu cần (dùng cùng logic với certifications)
      profile.awards = awards.map(award => ({
        _id: award._id || new mongoose.Types.ObjectId(),
        title: award.title || '',
        issuer: award.issuer || '',
        date: parseCertDate(award.date),
        description: award.description || '',
      }));

      // Update additional fields (luôn update, kể cả khi array rỗng để cho phép xóa)
      profile.hobbies = hobbies || [];
      profile.references = references.map(ref => ({
        _id: ref._id || new mongoose.Types.ObjectId(),
        name: ref.name,
        position: ref.position,
        company: ref.company,
        email: ref.email,
        phone: ref.phone,
        relationship: ref.relationship,
      }));

      // Calculate completion percentage
      profile.progress.profileCompleteness =
        this.calculateCompleteness(profile);
      profile.progress.lastUpdated = new Date();

      // Debug log trước khi save
      console.log('💾 Saving profile:', {
        educationCertificationsCount:
          profile.education?.certifications?.length || 0,
        educationFirstItem: profile.education?.certifications?.[0]
          ? {
              institution: profile.education.certifications[0].institution,
              startDate: profile.education.certifications[0].startDate,
              endDate: profile.education.certifications[0].endDate,
            }
          : null,
        experienceFulltimeCount: profile.experience?.fulltime?.length || 0,
        experienceFulltimeSample: profile.experience?.fulltime?.[0]
          ? {
              company: profile.experience.fulltime[0].company,
              position: profile.experience.fulltime[0].position,
              startDate: profile.experience.fulltime[0].startDate,
              endDate: profile.experience.fulltime[0].endDate,
            }
          : null,
        projectsCount: profile.projects?.length || 0,
        certificationsCount: profile.certifications?.length || 0,
        certificationsSample: profile.certifications?.[0]
          ? {
              name: profile.certifications[0].name,
              issueDate: profile.certifications[0].issueDate,
            }
          : null,
        awardsCount: profile.awards?.length || 0,
        awardsSample: profile.awards?.[0]
          ? {
              title: profile.awards[0].title,
              date: profile.awards[0].date,
            }
          : null,
        hobbiesCount: profile.hobbies?.length || 0,
        jobTitle: profile.personalInfo?.jobTitle,
      });

      await profile.save();

      return ApiResponse.success(
        res,
        {
          message: 'CV builder data updated successfully',
          completeness: profile.progress.profileCompleteness,
        },
        'Data updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // CV GENERATION
  // ========================================

  /**
   * POST /api/candidates/me/cv-builder/generate
   * Tạo CV thông minh với AI enhancement
   */
  async generateSmartCV(req, res, next) {
    try {
      const {
        template = 'minimal-clean',
        customization = {},
        sections = [],
        targetJob = null,
        format = 'html',
        jobDescription = null,
        companyInfo = null,
        language = 'vi',
        hideIcons = true,
      } = req.body;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError(
          'Profile not found. Please fill in your information first.',
          404
        );
      }

      // Validate template exists
      const { CV_TEMPLATES } = require('../../config/cvTemplates');
      if (!CV_TEMPLATES[template]) {
        throw new AppError(`Template '${template}' not found`, 400);
      }

      const templateConfig = CV_TEMPLATES[template];

      // Merge customization with template defaults
      const finalCustomization = {
        ...templateConfig.customization,
        ...customization,
      };

      console.log('🎨 Generating smart CV with template:', template);

      // Build comprehensive resume content
      const resumeContent = {
        personalInfo: {
          fullName: profile.personalInfo?.fullName || 'N/A',
          email: profile.personalInfo?.email || req.user.email || 'N/A',
          phone: profile.personalInfo?.phone || 'N/A',
          address: this.formatAddress(profile.personalInfo?.address) || 'N/A',
          website: profile.personalInfo?.website || null,
          linkedin: profile.personalInfo?.linkedin || null,
          github: profile.personalInfo?.github || null,
          avatar: profile.personalInfo?.avatar || null,
        },
        targetJob: profile.targetJob || { title: targetJob },
        careerObjective: profile.personalInfo?.bio || '',
        experience: this.getAllExperience(profile.experience),
        education: this.getAllEducation(profile.education),
        skills: profile.skills || {},
        projects: profile.projects || [],
        certifications: profile.certifications || [],
        awards: profile.awards || [],
        languages: profile.skills?.languages || [],
        hobbies: profile.hobbies || [],
        references: profile.references || [],
        sections: sections.length > 0 ? sections : templateConfig.sections,
        customization: finalCustomization,
      };

      let generatedCV;

      // For minimal-clean or hideIcons requests, use basic generator (icon-free)
      if (template === 'minimal-clean' || hideIcons === true) {
        if (sections && sections.length > 0) {
          resumeContent.sections = sections;
        }
        generatedCV = await resumeGeneratorService.generateBasicResume(
          resumeContent,
          template
        );
      } else {
        // Generate AI-enhanced CV
        generatedCV = await aiService.generateEnhancedCV(resumeContent, {
          template,
          targetJob: profile.targetJob?.title || targetJob,
          format,
          customization: finalCustomization,
          jobDescription,
          companyInfo,
          language,
        });
      }

      // Save to profile history
      if (!profile.resume.history) profile.resume.history = [];

      const newCVEntry = {
        _id: new mongoose.Types.ObjectId(),
        url: generatedCV.url,
        filename: `Smart_CV_${template}_${Date.now()}.${format}`,
        displayName: `Smart CV - ${
          profile.targetJob?.title || targetJob || 'General'
        }`,
        format: format,
        size: generatedCV.size,
        uploadedAt: new Date(),
        aiGenerated: template !== 'minimal-clean' && hideIcons !== true,
        template: template,
        customization: customization,
        targetJob: profile.targetJob?.title || targetJob,
      };

      profile.resume.history.push(newCVEntry);

      // Set as current if requested
      if (req.body.setAsCurrent !== false) {
        profile.resume.current = {
          ...newCVEntry,
          updatedAt: new Date(),
          aiAnalysis: generatedCV.optimization || {},
        };
      }

      await profile.save();

      return ApiResponse.success(
        res,
        {
          cv: generatedCV,
          entry: newCVEntry,
          message: 'Smart CV generated successfully with AI enhancement',
        },
        'Smart CV generated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // TEMPLATES MANAGEMENT
  // ========================================

  /**
   * POST /api/candidates/me/cv-builder/create-from-template
   * Tạo CV mới từ template
   *
   * Request body:
   * {
   *   templateId: "modern", // ID của template
   *   setAsDefault: true,    // Có đặt làm CV mặc định không
   * }
   */
  async createCVFromTemplate(req, res, next) {
    try {
      const { templateId, setAsDefault = false } = req.body;
      const userId = req.user.id;

      // 1. Validate templateId
      const { CV_TEMPLATES } = require('../../config/cvTemplates');
      if (!CV_TEMPLATES[templateId]) {
        return ApiResponse.error(res, 'Template not found', 404);
      }

      // 2. Lấy candidate profile
      const profile = await CandidateProfile.findOne({ userId });
      if (!profile) {
        return ApiResponse.error(
          res,
          'Candidate profile not found. Please complete your profile first.',
          404
        );
      }

      // 3. Lấy template config
      const template = CV_TEMPLATES[templateId];

      // 4. Tạo CV data từ profile hiện tại
      const cvData = {
        personalInfo: {
          fullName: profile.personalInfo?.fullName || '',
          email: req.user.email || profile.personalInfo?.email || '',
          phone: profile.personalInfo?.phone || '',
          address: this.formatAddress(profile.personalInfo?.address) || '',
          dateOfBirth: profile.personalInfo?.dateOfBirth || null,
          avatar: profile.personalInfo?.avatar || null,
          website: profile.personalInfo?.website || '',
          linkedin: profile.personalInfo?.linkedin || '',
          github: profile.personalInfo?.github || '',
        },
        summary: profile.summary || profile.personalInfo?.bio || '',
        experience: this.formatExperience(profile.experience),
        education: this.formatEducation(profile.education),
        skills: this.formatSkills(profile.skills),
        projects: this.formatProjects(profile.projects),
        certifications: this.formatCertifications(profile.certifications),
      };

      // 5. Tạo ResumeBuilder document
      const ResumeBuilder = require('../../models/ResumeBuilder');
      const newResume = new ResumeBuilder({
        candidateId: profile._id,
        templateId: templateId,
        content: cvData,
        customization: {
          targetRole: profile.targetJob?.title || '',
        },
        isDefault: setAsDefault,
        status: 'draft',
      });

      // 6. Nếu setAsDefault = true, unset các CV default khác
      if (setAsDefault) {
        await ResumeBuilder.updateMany(
          {
            candidateId: profile._id,
            _id: { $ne: newResume._id },
          },
          { isDefault: false }
        );
      }

      await newResume.save();

      // 7. Return response
      return ApiResponse.success(
        res,
        {
          resume: {
            _id: newResume._id,
            templateId: newResume.templateId,
            candidateId: newResume.candidateId,
            content: newResume.content,
            isDefault: newResume.isDefault,
            status: newResume.status,
            createdAt: newResume.createdAt,
            updatedAt: newResume.updatedAt,
          },
          template: {
            id: templateId,
            name: template.name,
            style: template.style,
            description: template.description,
          },
        },
        'CV created from template successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/cv-builder/resume/:resumeId
   * Lấy dữ liệu CV từ ResumeBuilder theo ID
   */
  async getResumeById(req, res, next) {
    try {
      const { resumeId } = req.params;
      const userId = req.user.id;

      const profile = await CandidateProfile.findOne({ userId });
      if (!profile) {
        return ApiResponse.error(res, 'Candidate profile not found', 404);
      }

      const ResumeBuilder = require('../../models/ResumeBuilder');
      const resume = await ResumeBuilder.findOne({
        _id: resumeId,
        candidateId: profile._id,
      });

      if (!resume) {
        return ApiResponse.error(res, 'CV not found', 404);
      }

      // Format data để frontend sử dụng
      const cvData = {
        resumeId: resume._id,
        templateId: resume.templateId,
        content: resume.content,
        customization: resume.customization,
        isDefault: resume.isDefault,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };

      return ApiResponse.success(res, cvData, 'CV data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/cv-builder/default
   * Lấy CV mặc định (isDefault = true) hoặc CV mới nhất
   */
  async getDefaultResume(req, res, next) {
    try {
      const userId = req.user.id;

      const profile = await CandidateProfile.findOne({ userId });
      if (!profile) {
        return ApiResponse.error(res, 'Candidate profile not found', 404);
      }

      const ResumeBuilder = require('../../models/ResumeBuilder');

      // Tìm CV mặc định
      let resume = await ResumeBuilder.findOne({
        candidateId: profile._id,
        isDefault: true,
        status: { $ne: 'archived' },
      }).sort({ updatedAt: -1 });

      // Nếu không có default, lấy CV mới nhất
      if (!resume) {
        resume = await ResumeBuilder.findOne({
          candidateId: profile._id,
          status: { $ne: 'archived' },
        }).sort({ updatedAt: -1 });
      }

      if (!resume) {
        // Trả về empty data nếu chưa có CV nào
        return ApiResponse.success(
          res,
          {
            resumeId: null,
            templateId: null,
            content: this.getEmptyBuilderData(),
            customization: {},
            isDefault: false,
            status: 'draft',
          },
          'No CV found, returning empty data'
        );
      }

      // Format data để frontend sử dụng
      const cvData = {
        resumeId: resume._id,
        templateId: resume.templateId,
        content: resume.content,
        customization: resume.customization,
        isDefault: resume.isDefault,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      };

      return ApiResponse.success(
        res,
        cvData,
        'Default CV data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/cv-builder/template/:templateId
   * Lấy thông tin chi tiết của một template (bao gồm renderLayout)
   */
  async getTemplateById(req, res, next) {
    try {
      const { templateId } = req.params;
      const { CV_TEMPLATES } = require('../../config/cvTemplates');
      const {
        generateRenderLayout,
      } = require('../../config/templateLayoutHelper');

      if (!CV_TEMPLATES[templateId]) {
        return ApiResponse.error(res, 'Template not found', 404);
      }

      const template = CV_TEMPLATES[templateId];

      // Tự động generate renderLayout nếu chưa có
      let renderLayout = template.renderLayout;
      if (!renderLayout) {
        renderLayout = generateRenderLayout(template);
      }

      return ApiResponse.success(
        res,
        {
          id: templateId,
          name: template.name,
          description: template.description,
          preview: template.preview || {
            image: `/templates/previews/${templateId}-preview.jpg`,
            thumbnail: `/templates/previews/${templateId}-thumb.jpg`,
            description: template.description,
          },
          industryCode: template.industryCode || template.category || 'general',
          color: template.color,
          style: template.style,
          sections: template.sections,
          customization: template.customization,
          // Trả về renderLayout để frontend có thể render
          renderLayout: renderLayout,
        },
        'Template retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/candidates/me/cv-builder/templates
   * Lấy danh sách CV templates có sẵn
   */
  async getTemplates(req, res, next) {
    try {
      const { CV_TEMPLATES } = require('../../config/cvTemplates');
      const { industryCode, category, style } = req.query;

      const {
        generateRenderLayout,
      } = require('../../config/templateLayoutHelper');

      let templates = Object.entries(CV_TEMPLATES).map(([key, template]) => {
        // Tự động generate renderLayout nếu chưa có
        let renderLayout = template.renderLayout;
        if (!renderLayout) {
          renderLayout = generateRenderLayout(template);
        }

        return {
          id: key,
          name: template.name,
          description: template.description,
          preview: template.preview || {
            image: `/templates/previews/${key}-preview.jpg`,
            thumbnail: `/templates/previews/${key}-thumb.jpg`,
            description: template.description,
          },
          industryCode: template.industryCode || template.category || 'general',
          color: template.color,
          style: template.style,
          sections: template.sections,
          customization: template.customization,
          // Thêm renderLayout vào response để frontend có thể render
          renderLayout: renderLayout,
          isPopular: ['modern', 'student-tech', 'minimal'].includes(key),
          customizable: {
            colors: true,
            fonts: true,
            layout: true,
            sections: true,
          },
        };
      });

      // Filter by industryCode (preferred) or legacy category
      const effectiveIndustry = industryCode || category;
      if (effectiveIndustry) {
        templates = templates.filter(t => t.industryCode === effectiveIndustry);
      }

      // Filter by style if provided
      if (style) {
        templates = templates.filter(t => t.style === style);
      }

      // Group by category
      const groupedTemplates = templates.reduce((acc, template) => {
        const key = template.industryCode;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(template);
        return acc;
      }, {});

      return ApiResponse.success(
        res,
        {
          templates,
          groupedTemplates,
          industries: Object.keys(groupedTemplates),
          total: templates.length,
        },
        'CV templates retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // PDF EXPORT
  // ========================================

  /**
   * POST /api/candidates/me/cv-builder/export-pdf
   * Export CV thành PDF từ URL hoặc CV ID
   */
  async exportPDF(req, res, next) {
    try {
      const {
        cvId,
        cvUrl,
        template = 'modern',
        pdfOptions = {},
        filename = null,
      } = req.body;

      if (!cvId && !cvUrl) {
        throw new AppError('Either cvId or cvUrl is required', 400);
      }

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      let htmlContent = null;
      let cvUrlToUse = cvUrl;

      // If cvId is provided, get the CV from database
      if (cvId) {
        const cvEntry = profile.documents?.find(
          doc => doc._id.toString() === cvId
        );
        if (!cvEntry) {
          throw new AppError('CV not found', 404);
        }
        cvUrlToUse = cvEntry.url;
      }

      // Generate filename if not provided
      const candidateName = profile.personalInfo?.fullName || 'Candidate';
      const targetJob = profile.targetJob?.title || 'General';
      const finalFilename =
        filename ||
        pdfGenerationService.generatePDFFilename(
          candidateName,
          targetJob,
          template
        );

      // Get PDF options for template
      const templatePDFOptions =
        pdfGenerationService.getPDFOptionsForTemplate(template);
      const finalPDFOptions = { ...templatePDFOptions, ...pdfOptions };

      console.log('🔄 Exporting CV to PDF...');
      console.log(`📄 CV URL: ${cvUrlToUse}`);
      console.log(`📁 Filename: ${finalFilename}`);
      console.log(`🎨 Template: ${template}`);

      // Generate PDF from CV URL
      const pdfResult = await pdfGenerationService.generatePDFFromCVURL(
        cvUrlToUse,
        finalFilename,
        finalPDFOptions
      );

      // Save PDF entry to profile
      const pdfEntry = {
        url: pdfResult.url,
        filename: pdfResult.filename,
        displayName: `PDF - ${candidateName} - ${targetJob}`,
        format: 'pdf',
        size: pdfResult.size,
        uploadedAt: pdfResult.uploadedAt,
        aiGenerated: false,
        template: template,
        targetJob: targetJob,
        pdfOptions: finalPDFOptions,
      };

      // Add to profile documents
      if (!profile.documents) {
        profile.documents = [];
      }
      profile.documents.push(pdfEntry);

      await profile.save();

      console.log('✅ PDF exported successfully');

      return ApiResponse.success(
        res,
        {
          pdf: pdfResult,
          entry: pdfEntry,
          message: 'CV exported to PDF successfully',
        },
        'CV exported to PDF successfully'
      );
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      next(error);
    }
  }

  /**
   * POST /api/candidates/me/cv-builder/export-pdf-direct
   * Export CV thành PDF trực tiếp từ HTML content
   */
  async exportPDFDirect(req, res, next) {
    try {
      const {
        htmlContent,
        template = 'modern',
        pdfOptions = {},
        filename = null,
      } = req.body;

      if (!htmlContent) {
        throw new AppError('HTML content is required', 400);
      }

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      // Generate filename if not provided
      const candidateName = profile.personalInfo?.fullName || 'Candidate';
      const targetJob = profile.targetJob?.title || 'General';
      const finalFilename =
        filename ||
        pdfGenerationService.generatePDFFilename(
          candidateName,
          targetJob,
          template
        );

      // Get PDF options for template
      const templatePDFOptions =
        pdfGenerationService.getPDFOptionsForTemplate(template);
      const finalPDFOptions = { ...templatePDFOptions, ...pdfOptions };

      console.log('🔄 Exporting CV to PDF directly from HTML...');
      console.log(`📁 Filename: ${finalFilename}`);
      console.log(`🎨 Template: ${template}`);

      // Generate PDF from HTML content
      const pdfResult = await pdfGenerationService.generateAndUploadPDF(
        htmlContent,
        finalFilename,
        finalPDFOptions
      );

      // Save PDF entry to profile
      const pdfEntry = {
        url: pdfResult.url,
        filename: pdfResult.filename,
        displayName: `PDF - ${candidateName} - ${targetJob}`,
        format: 'pdf',
        size: pdfResult.size,
        uploadedAt: pdfResult.uploadedAt,
        aiGenerated: false,
        template: template,
        targetJob: targetJob,
        pdfOptions: finalPDFOptions,
      };

      // Add to profile documents
      if (!profile.documents) {
        profile.documents = [];
      }
      profile.documents.push(pdfEntry);

      await profile.save();

      console.log('✅ PDF exported successfully from HTML');

      return ApiResponse.success(
        res,
        {
          pdf: pdfResult,
          entry: pdfEntry,
          message: 'CV exported to PDF successfully from HTML',
        },
        'CV exported to PDF successfully'
      );
    } catch (error) {
      console.error('❌ PDF export from HTML failed:', error);
      next(error);
    }
  }

  // ========================================
  // CV HISTORY MANAGEMENT
  // ========================================

  /**
   * GET /api/candidates/me/cv-builder/history
   * Lấy lịch sử các CV đã tạo
   */
  async getCVHistory(req, res, next) {
    try {
      const profile = await CandidateProfile.findOne({ userId: req.user.id });

      if (!profile || !profile.resume.history) {
        return ApiResponse.success(
          res,
          {
            history: [],
            current: null,
          },
          'No CV history found'
        );
      }

      return ApiResponse.success(
        res,
        {
          history: profile.resume.history.sort(
            (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
          ),
          current: profile.resume.current,
        },
        'CV history retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/candidates/me/cv-builder/history/:cvId
   * Xóa CV khỏi lịch sử
   */
  async deleteCVFromHistory(req, res, next) {
    try {
      const { cvId } = req.params;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      const cvIndex = profile.resume.history.findIndex(
        cv => cv._id.toString() === cvId
      );

      if (cvIndex === -1) {
        throw new AppError('CV not found in history', 404);
      }

      profile.resume.history.splice(cvIndex, 1);
      await profile.save();

      return ApiResponse.success(
        res,
        {
          message: 'CV deleted from history successfully',
        },
        'CV deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/candidates/me/cv-builder/current/:cvId
   * Đặt CV làm current CV
   */
  async setCurrentCV(req, res, next) {
    try {
      const { cvId } = req.params;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      const cvEntry = profile.resume.history.find(
        cv => cv._id.toString() === cvId
      );

      if (!cvEntry) {
        throw new AppError('CV not found in history', 404);
      }

      profile.resume.current = {
        ...cvEntry.toObject(),
        updatedAt: new Date(),
      };

      await profile.save();

      return ApiResponse.success(
        res,
        {
          current: profile.resume.current,
          message: 'Current CV updated successfully',
        },
        'Current CV set successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // AVATAR UPLOAD
  // ========================================

  /**
   * POST /api/candidates/me/cv-builder/avatar
   * Upload avatar cho CV builder
   * Avatar sẽ được lưu vào CandidateProfile.personalInfo.avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(
          res,
          'Vui lòng chọn file hình ảnh để upload',
          400
        );
      }

      // Upload avatar lên Cloudinary
      const result = await uploadImage('avatar', req.file.buffer);

      // Lấy hoặc tạo profile
      let profile = await CandidateProfile.findOne({ userId: req.user.id });

      if (!profile) {
        profile = new CandidateProfile({
          userId: req.user.id,
          personalInfo: {
            avatar: result.url,
          },
          progress: { profileCompleteness: 0, lastUpdated: new Date() },
          status: 'active',
        });
      } else {
        // Update avatar trong personalInfo
        if (!profile.personalInfo) {
          profile.personalInfo = {};
        }
        profile.personalInfo.avatar = result.url;
        profile.progress.lastUpdated = new Date();
      }

      await profile.save();

      logger.info(`CV Builder avatar uploaded for user: ${req.user.id}`, {
        userId: req.user.id,
        publicId: result.publicId,
        url: result.url,
      });

      return ApiResponse.success(
        res,
        {
          avatar: {
            publicId: result.publicId,
            url: result.url,
            size: result.bytes,
            format: result.format,
            dimensions: { width: result.width, height: result.height },
          },
        },
        'Upload avatar thành công'
      );
    } catch (error) {
      logger.error('Failed to upload CV builder avatar', {
        error: error.message,
        userId: req.user.id,
      });
      next(error);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  getEmptyBuilderData() {
    return {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: null,
        dateOfBirth: null,
        avatar: null,
        website: '',
        linkedin: '',
        github: '',
      },
      targetJob: {
        title: '',
        industry: '',
        level: 'entry',
        salary: '',
        location: '',
      },
      careerObjective: '',
      experience: [],
      education: [],
      skills: { technical: [], soft: [], languages: [] },
      projects: [],
      certifications: [],
      awards: [],
      languages: [],
      hobbies: [],
      references: [],
    };
  }

  formatAddress(address) {
    if (!address) return '';
    if (typeof address === 'string') return address;

    const { street, ward, district, city } = address;
    // Bỏ country (Vietnam) khỏi chuỗi địa chỉ
    return [street, ward, district, city].filter(Boolean).join(', ');
  }

  formatExperience(experience) {
    if (!experience) return [];

    const allExp = [];
    ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
      if (experience[type] && Array.isArray(experience[type])) {
        experience[type].forEach(exp => {
          // Format date từ Date object sang string "YYYY-MM"
          const formatDate = (date) => {
            if (!date) return '';
            if (date instanceof Date) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              return `${year}-${month}`;
            }
            if (typeof date === 'string') return date;
            return String(date);
          };

          allExp.push({
            company: exp.company || '',
            position: exp.position || '',
            startDate: formatDate(exp.startDate),
            endDate: formatDate(exp.endDate),
            description: exp.description || '',
            type: type.replace('internships', 'internship'),
          });
        });
      }
    });

    return allExp.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
      return dateB - dateA; // Sort descending (newest first)
    });
  }

  filterExperienceByType(experiences, type) {
    if (!experiences || !Array.isArray(experiences)) return [];
    
    // Parse date từ string sang Date object
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '') return null;
      if (dateStr instanceof Date) return dateStr;
      // Nếu là string "YYYY-MM" hoặc "YYYY", parse thành Date
      if (typeof dateStr === 'string') {
        const dateMatch = dateStr.trim().match(/^(\d{4})(?:-(\d{2}))?/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10);
          const month = dateMatch[2] ? parseInt(dateMatch[2], 10) - 1 : 0; // Month is 0-indexed
          return new Date(year, month, 1);
        }
        // Try to parse as ISO date
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };
    
    return experiences
      .filter(exp => exp.type === type)
      .map(exp => ({
        _id: exp._id || new mongoose.Types.ObjectId(),
        company: exp.company || '',
        position: exp.position || '',
        location: exp.location || null,
        startDate: parseDate(exp.startDate),
        endDate: parseDate(exp.endDate),
        description: exp.description || '',
        achievements: exp.achievements || [],
        skills: exp.skills || [],
        current: exp.current || false,
      }));
  }

  formatEducation(education) {
    if (!education) return [];

    const allEdu = [];

    // Lấy tất cả education items từ certifications array (nơi lưu nhiều items)
    if (education.certifications && Array.isArray(education.certifications)) {
      education.certifications.forEach(edu => {
        // Chỉ lấy các items có type là education (không phải certification thật)
        if (
          edu.type === 'university' ||
          edu.type === 'highschool' ||
          !edu.type ||
          edu.institution
        ) {
          // Convert startDate/endDate (Date) hoặc startYear/endYear (Number) hoặc graduationYear (Number) sang string "YYYY"
          const formatYear = dateOrYear => {
            if (!dateOrYear) return '';
            // Nếu là Date object
            if (dateOrYear instanceof Date) {
              return String(dateOrYear.getFullYear());
            }
            // Nếu là number (year)
            if (typeof dateOrYear === 'number') {
              return String(dateOrYear);
            }
            // Nếu là string
            if (typeof dateOrYear === 'string') {
              const yearMatch = dateOrYear.match(/^(\d{4})/);
              return yearMatch ? yearMatch[1] : dateOrYear;
            }
            return String(dateOrYear);
          };

          // Ưu tiên lấy từ startDate/endDate, sau đó startYear/endYear, cuối cùng graduationYear
          const startYear = formatYear(
            edu.startDate || edu.startYear || edu.graduationYear
          );
          const endYear = formatYear(
            edu.endDate || edu.endYear || edu.graduationYear
          );

          allEdu.push({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            startYear: startYear,
            endYear: endYear,
            type: edu.type || 'university',
            gpa: edu.gpa,
            achievements: edu.achievements || [],
            coursework: edu.coursework || [],
          });
        }
      });
    }

    // Fallback: nếu không có trong certifications, lấy từ university và highSchool
    if (allEdu.length === 0) {
      if (education.university) {
        const formatYear = year => {
          if (!year) return '';
          if (typeof year === 'number') return String(year);
          if (typeof year === 'string') {
            const yearMatch = year.match(/^(\d{4})/);
            return yearMatch ? yearMatch[1] : year;
          }
          return String(year);
        };

        allEdu.push({
          institution: education.university.institution || '',
          degree: education.university.degree || '',
          field: education.university.field || '',
          startYear: formatYear(
            education.university.startYear ||
              education.university.graduationYear
          ),
          endYear: formatYear(
            education.university.endYear || education.university.graduationYear
          ),
          type: 'university',
          gpa: education.university.gpa,
          achievements: education.university.achievements || [],
          coursework: education.university.coursework || [],
        });
      }
      if (education.highSchool) {
        allEdu.push({
          institution: education.highSchool.school || '',
          degree: '',
          field: '',
          startYear: '',
          endYear: education.highSchool.graduationYear || '',
          type: 'highschool',
          gpa: education.highSchool.gpa,
          achievements: education.highSchool.achievements || [],
        });
      }
    }

    return allEdu;
  }

  formatSkills(skills) {
    return {
      technical: skills?.technical || [],
      soft: skills?.soft || [],
      languages: skills?.languages || [],
    };
  }

  formatProjects(projects) {
    if (!projects || !Array.isArray(projects)) return [];
    
    // Format date từ Date object sang string "YYYY-MM"
    const formatDate = (date) => {
      if (!date) return '';
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
      if (typeof date === 'string') return date;
      return String(date);
    };

    return projects.map(project => ({
      title: project.title || '',
      description: project.description || '',
      technologies: project.technologies || [],
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      status: project.status || 'completed',
      url: project.url || null,
      github: project.github || null,
      achievements: project.achievements || [],
    }));
  }

  formatCertifications(certifications) {
    if (!certifications || !Array.isArray(certifications)) return [];
    
    // Format date từ Date object sang string "YYYY-MM-DD" hoặc "YYYY"
    const formatDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof date === 'string') return date;
      return String(date);
    };

    return certifications.map(cert => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      issueDate: formatDate(cert.issueDate),
      expiryDate: formatDate(cert.expiryDate),
      credentialId: cert.credentialId || null,
      url: cert.url || null,
      year: cert.issueDate
        ? String(new Date(cert.issueDate).getFullYear())
        : cert.year || '',
    }));
  }

  formatAwards(awards) {
    if (!awards || !Array.isArray(awards)) return [];
    
    // Format date từ Date object sang string "YYYY-MM-DD" hoặc "YYYY"
    const formatDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof date === 'string') return date;
      return String(date);
    };

    return awards.map(award => ({
      title: award.title || '',
      issuer: award.issuer || '',
      date: formatDate(award.date),
      year: award.date
        ? String(new Date(award.date).getFullYear())
        : award.year || '',
      description: award.description || '',
    }));
  }

  formatLanguages(languages) {
    return languages || [];
  }

  getAllExperience(experience) {
    const allExp = [];
    if (experience) {
      ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
        if (experience[type]) {
          experience[type].forEach(exp => allExp.push(exp));
        }
      });
    }
    return allExp.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  getAllEducation(education) {
    const allEdu = [];
    if (education?.university) allEdu.push(education.university);
    if (education?.highSchool) allEdu.push(education.highSchool);
    return allEdu;
  }

  calculateCompleteness(profile) {
    let score = 0;
    let total = 0;

    // Personal info (20 points)
    total += 20;
    if (profile.personalInfo?.fullName) score += 5;
    if (profile.personalInfo?.email) score += 5;
    if (profile.personalInfo?.phone) score += 5;
    if (profile.personalInfo?.address) score += 5;

    // Experience (25 points)
    total += 25;
    const allExp = this.getAllExperience(profile.experience);
    if (allExp.length > 0) score += 15;
    if (allExp.length >= 2) score += 10;

    // Education (20 points)
    total += 20;
    if (profile.education?.university) score += 15;
    if (profile.education?.highSchool) score += 5;

    // Skills (20 points)
    total += 20;
    if (profile.skills?.technical?.length > 0) score += 10;
    if (profile.skills?.soft?.length > 0) score += 5;
    if (profile.skills?.languages?.length > 0) score += 5;

    // Additional (15 points)
    total += 15;
    if (profile.projects?.length > 0) score += 5;
    if (profile.certifications?.length > 0) score += 5;
    if (profile.personalInfo?.bio) score += 5;

    return Math.round((score / total) * 100);
  }
}

module.exports = CVBuilderController;
