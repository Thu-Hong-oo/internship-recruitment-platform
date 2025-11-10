// const mongoose = require('mongoose');
// const CandidateProfile = require('../../models/CandidateProfile');
// const aiService = require('../../services/aiService');
// const pdfGenerationService = require('../../services/pdfGenerationService');
// const resumeGeneratorService = require('../../services/resumeGeneratorService');
// const { ApiResponse } = require('../../utils/responseHandler');
// const { AppError } = require('../../utils/errors');

// /**
//  * CVBuilderController - Quản lý tất cả tính năng CV Builder cho Candidates
//  *
//  * CHỨC NĂNG CHÍNH:
//  * 1. CV Builder Core: CRUD CV data, templates
//  * 2. AI Features: AI suggestions, job matching, skill analysis
//  * 3. PDF Export: Export và xem PDF
//  * 4. Helper Methods: Utilities và formatters
//  */
// class CVBuilderController {
//   constructor() {
//     // CV Builder Core
//     this.getBuilderData = this.getBuilderData.bind(this);
//     this.updateBuilderData = this.updateBuilderData.bind(this);
//     this.generateSmartCV = this.generateSmartCV.bind(this);
//     this.generateDirectCV = this.generateDirectCV.bind(this);
//     this.getTemplates = this.getTemplates.bind(this);
//     this.analyzeJobDescription = this.analyzeJobDescription.bind(this);

//     // AI Features
//     this.getAISuggestions = this.getAISuggestions.bind(this);
//     this.analyzeJobMatch = this.analyzeJobMatch.bind(this);
//     this.getSkillGapAnalysis = this.getSkillGapAnalysis.bind(this);
//     this.generateSkillRoadmap = this.generateSkillRoadmap.bind(this);

//     // PDF Export
//     this.exportPDF = this.exportPDF.bind(this);
//     this.exportPDFDirect = this.exportPDFDirect.bind(this);
//   }

//   // ========================================
//   // CV BUILDER CORE - Quản lý dữ liệu CV
//   // ========================================

//   /**
//    * POST /api/candidates/me/cv-builder/generate-direct
//    * Tạo CV từ text thô bằng AI parsing
//    */
//   async generateDirectCV(req, res, next) {
//     try {
//       const { rawCVText } = req.body;
//       if (
//         !rawCVText ||
//         typeof rawCVText !== 'string' ||
//         rawCVText.trim().length === 0
//       ) {
//         return ApiResponse.error(res, 'Missing or invalid rawCVText', 400);
//       }

//       // Analyze raw CV text using AI service
//       const analysis = await aiService.analyzeCV(rawCVText);

//       // Optionally, create a new CandidateProfile or update existing with extracted data
//       let profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         profile = new CandidateProfile({ userId: req.user.id });
//       }

//       // Update profile fields with extracted data (do not overwrite existing unless empty)
//       profile.skills = analysis.skills || profile.skills;
//       profile.experience = analysis.experience || profile.experience;
//       profile.education = analysis.education || profile.education;
//       profile.personalInfo = {
//         ...profile.personalInfo,
//         ...analysis.contact,
//         bio: analysis.summary || profile.personalInfo?.bio || '',
//       };
//       await profile.save();

//       // Return extracted CV data for user editing
//       return ApiResponse.success(
//         res,
//         {
//           builderData: analysis,
//           message: 'CV generated from raw text successfully',
//         },
//         'CV generated from raw text successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * GET /api/candidates/me/cv-builder
//    * Lấy dữ liệu CV builder hiện tại
//    */
//   async getBuilderData(req, res, next) {
//     try {
//       const profile = await CandidateProfile.findOne({ userId: req.user.id });

//       if (!profile) {
//         // Return empty template for new users
//         return ApiResponse.success(
//           res,
//           this.getEmptyBuilderData(),
//           'CV builder data retrieved'
//         );
//       }

//       const builderData = {
//         personalInfo: {
//           fullName: profile.personalInfo?.fullName || '',
//           email: req.user.email || profile.personalInfo?.email || '',
//           phone: profile.personalInfo?.phone || '',
//           address: this.formatAddress(profile.personalInfo?.address) || '',
//           dateOfBirth: profile.personalInfo?.dateOfBirth || null,
//           avatar: profile.personalInfo?.avatar || null,
//           website: profile.personalInfo?.website || '',
//           linkedin: profile.personalInfo?.linkedin || '',
//           github: profile.personalInfo?.github || '',
//         },
//         targetJob: {
//           title: '',
//           industry: '',
//           level: 'entry', // entry, mid, senior
//           salary: '',
//           location: '',
//         },
//         careerObjective: profile.personalInfo?.bio || '',
//         experience: this.formatExperience(profile.experience),
//         education: this.formatEducation(profile.education),
//         skills: this.formatSkills(profile.skills),
//         projects: this.formatProjects(profile.projects),
//         certifications: this.formatCertifications(profile.certifications),
//         awards: this.formatAwards(profile.awards),
//         languages: this.formatLanguages(profile.languages),
//         hobbies: profile.hobbies || [],
//         references: profile.references || [],
//       };

//       return ApiResponse.success(
//         res,
//         builderData,
//         'CV builder data retrieved successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * PUT /api/candidates/me/cv-builder
//    * Cập nhật dữ liệu CV builder
//    */
//   async updateBuilderData(req, res, next) {
//     try {
//       const {
//         personalInfo,
//         targetJob,
//         careerObjective,
//         experience = [],
//         education = [],
//         skills = {},
//         projects = [],
//         certifications = [],
//         awards = [],
//         languages = [],
//         hobbies = [],
//         references = [],
//       } = req.body;

//       let profile = await CandidateProfile.findOne({ userId: req.user.id });

//       if (!profile) {
//         // Auto-create profile
//         profile = new CandidateProfile({
//           userId: req.user.id,
//           personalInfo: {},
//           progress: { profileCompleteness: 0, lastUpdated: new Date() },
//           status: 'active',
//         });
//       }

//       // Update personal info
//       if (personalInfo) {
//         profile.personalInfo = {
//           ...profile.personalInfo,
//           fullName:
//             personalInfo.fullName || profile.personalInfo?.fullName || '',
//           email: personalInfo.email || profile.personalInfo?.email || '',
//           phone: personalInfo.phone || profile.personalInfo?.phone || '',
//           address: personalInfo.address || profile.personalInfo?.address || '',
//           dateOfBirth:
//             personalInfo.dateOfBirth ||
//             profile.personalInfo?.dateOfBirth ||
//             null,
//           avatar: personalInfo.avatar || profile.personalInfo?.avatar || null,
//           website: personalInfo.website || profile.personalInfo?.website || '',
//           linkedin:
//             personalInfo.linkedin || profile.personalInfo?.linkedin || '',
//           github: personalInfo.github || profile.personalInfo?.github || '',
//           bio: careerObjective || profile.personalInfo?.bio || '',
//         };
//       }

//       // Update target job (store in a new field)
//       profile.targetJob = targetJob;

//       // Update experience
//       if (experience.length > 0) {
//         profile.experience = {
//           internships: experience
//             .filter(exp => exp.type === 'internship')
//             .map(exp => ({
//               _id: exp._id || new mongoose.Types.ObjectId(),
//               company: exp.company,
//               position: exp.position,
//               location: exp.location,
//               startDate: exp.startDate,
//               endDate: exp.endDate,
//               description: exp.description,
//               achievements: exp.achievements || [],
//               skills: exp.skills || [],
//               current: exp.current || false,
//             })),
//           fulltime: experience
//             .filter(exp => exp.type === 'fulltime')
//             .map(exp => ({
//               _id: exp._id || new mongoose.Types.ObjectId(),
//               company: exp.company,
//               position: exp.position,
//               location: exp.location,
//               startDate: exp.startDate,
//               endDate: exp.endDate,
//               description: exp.description,
//               achievements: exp.achievements || [],
//               skills: exp.skills || [],
//               current: exp.current || false,
//             })),
//           parttime: experience
//             .filter(exp => exp.type === 'parttime')
//             .map(exp => ({
//               _id: exp._id || new mongoose.Types.ObjectId(),
//               company: exp.company,
//               position: exp.position,
//               location: exp.location,
//               startDate: exp.startDate,
//               endDate: exp.endDate,
//               description: exp.description,
//               achievements: exp.achievements || [],
//               skills: exp.skills || [],
//               current: exp.current || false,
//             })),
//           freelance: experience
//             .filter(exp => exp.type === 'freelance')
//             .map(exp => ({
//               _id: exp._id || new mongoose.Types.ObjectId(),
//               company: exp.company,
//               position: exp.position,
//               location: exp.location,
//               startDate: exp.startDate,
//               endDate: exp.endDate,
//               description: exp.description,
//               achievements: exp.achievements || [],
//               skills: exp.skills || [],
//               current: exp.current || false,
//             })),
//         };
//       }

//       // Update education
//       if (education.length > 0) {
//         const university = education.find(edu => edu.type === 'university');
//         if (university) {
//           profile.education.university = {
//             _id: university._id || new mongoose.Types.ObjectId(),
//             institution: university.institution,
//             degree: university.degree,
//             field: university.field,
//             startYear: university.startYear,
//             endYear: university.endYear,
//             gpa: university.gpa,
//             achievements: university.achievements || [],
//             coursework: university.coursework || [],
//           };
//         }

//         const highSchool = education.find(edu => edu.type === 'highschool');
//         if (highSchool) {
//           profile.education.highSchool = {
//             _id: highSchool._id || new mongoose.Types.ObjectId(),
//             school: highSchool.institution,
//             graduationYear: highSchool.endYear,
//             gpa: highSchool.gpa,
//             achievements: highSchool.achievements || [],
//           };
//         }
//       }

//       // Update skills
//       if (skills.technical) {
//         profile.skills.technical = skills.technical.map(skill => ({
//           _id: skill._id || new mongoose.Types.ObjectId(),
//           name: skill.name,
//           level: skill.level || 'intermediate',
//           verified: skill.verified || false,
//           yearsOfExperience: skill.yearsOfExperience || 0,
//         }));
//       }

//       if (skills.soft) {
//         profile.skills.soft = skills.soft.map(skill => ({
//           _id: skill._id || new mongoose.Types.ObjectId(),
//           name: skill.name,
//           level: skill.level || 'intermediate',
//         }));
//       }

//       if (skills.languages) {
//         profile.skills.languages = skills.languages.map(lang => ({
//           _id: lang._id || new mongoose.Types.ObjectId(),
//           language: lang.name || lang.language,
//           level: lang.level,
//           certification: lang.certification || null,
//         }));
//       }

//       // Update projects
//       if (projects.length > 0) {
//         profile.projects = projects.map(project => ({
//           _id: project._id || new mongoose.Types.ObjectId(),
//           title: project.title,
//           description: project.description,
//           technologies: project.technologies || [],
//           startDate: project.startDate,
//           endDate: project.endDate,
//           status: project.status || 'completed',
//           url: project.url || null,
//           github: project.github || null,
//           achievements: project.achievements || [],
//         }));
//       }

//       // Update certifications
//       if (certifications.length > 0) {
//         profile.certifications = certifications.map(cert => ({
//           _id: cert._id || new mongoose.Types.ObjectId(),
//           name: cert.name,
//           issuer: cert.issuer,
//           issueDate: cert.issueDate,
//           expiryDate: cert.expiryDate,
//           credentialId: cert.credentialId || null,
//           url: cert.url || null,
//         }));
//       }

//       // Update awards
//       if (awards.length > 0) {
//         profile.awards = awards.map(award => ({
//           _id: award._id || new mongoose.Types.ObjectId(),
//           title: award.title,
//           issuer: award.issuer,
//           date: award.date,
//           description: award.description || '',
//         }));
//       }

//       // Update additional fields
//       profile.hobbies = hobbies;
//       profile.references = references.map(ref => ({
//         _id: ref._id || new mongoose.Types.ObjectId(),
//         name: ref.name,
//         position: ref.position,
//         company: ref.company,
//         email: ref.email,
//         phone: ref.phone,
//         relationship: ref.relationship,
//       }));

//       // Calculate completion percentage
//       profile.progress.profileCompleteness =
//         this.calculateCompleteness(profile);
//       profile.progress.lastUpdated = new Date();

//       await profile.save();

//       return ApiResponse.success(
//         res,
//         {
//           message: 'CV builder data updated successfully',
//           completeness: profile.progress.profileCompleteness,
//         },
//         'Data updated successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/generate
//    * Tạo CV thông minh với AI enhancement
//    */
//   async generateSmartCV(req, res, next) {
//     try {
//       const {
//         template = 'minimal-clean',
//         customization = {},
//         sections = [],
//         targetJob = null,
//         format = 'html',
//         jobDescription = null,
//         companyInfo = null,
//         language = 'vi',
//         hideIcons = true,
//       } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         throw new AppError(
//           'Profile not found. Please fill in your information first.',
//           404
//         );
//       }

//       // Validate template exists
//       const { CV_TEMPLATES } = require('../../config/cvTemplates');
//       if (!CV_TEMPLATES[template]) {
//         throw new AppError(`Template '${template}' not found`, 400);
//       }

//       // Get template configuration
//       const templateConfig = CV_TEMPLATES[template];

//       // Merge customization with template defaults
//       const finalCustomization = {
//         ...templateConfig.customization,
//         ...customization,
//       };

//       console.log('🎨 Generating smart CV with template:', template);

//       // Build comprehensive resume content
//       const resumeContent = {
//         personalInfo: {
//           fullName: profile.personalInfo?.fullName || 'N/A',
//           email: profile.personalInfo?.email || req.user.email || 'N/A',
//           phone: profile.personalInfo?.phone || 'N/A',
//           address: this.formatAddress(profile.personalInfo?.address) || 'N/A',
//           website: profile.personalInfo?.website || null,
//           linkedin: profile.personalInfo?.linkedin || null,
//           github: profile.personalInfo?.github || null,
//           avatar: profile.personalInfo?.avatar || null,
//         },
//         targetJob: profile.targetJob || { title: targetJob },
//         careerObjective: profile.personalInfo?.bio || '',
//         experience: this.getAllExperience(profile.experience),
//         education: this.getAllEducation(profile.education),
//         skills: profile.skills || {},
//         projects: profile.projects || [],
//         certifications: profile.certifications || [],
//         awards: profile.awards || [],
//         languages: profile.skills?.languages || [],
//         hobbies: profile.hobbies || [],
//         references: profile.references || [],
//         sections: sections.length > 0 ? sections : templateConfig.sections,
//         customization: finalCustomization,
//       };

//       let generatedCV;

//       // For minimal-clean or hideIcons requests, use basic generator (icon-free)
//       if (template === 'minimal-clean' || hideIcons === true) {
//         // Ensure sections override if provided
//         if (sections && sections.length > 0) {
//           resumeContent.sections = sections;
//         }
//         // Generate icon-free HTML
//         generatedCV = await resumeGeneratorService.generateBasicResume(
//           resumeContent,
//           template
//         );
//       } else {
//         // Generate AI-enhanced CV
//         generatedCV = await aiService.generateEnhancedCV(resumeContent, {
//           template,
//           targetJob: profile.targetJob?.title || targetJob,
//           format,
//           customization: finalCustomization,
//           jobDescription,
//           companyInfo,
//           language,
//         });
//       }

//       // Save to profile history
//       if (!profile.resume.history) profile.resume.history = [];

//       const newCVEntry = {
//         _id: new mongoose.Types.ObjectId(),
//         url: generatedCV.url,
//         filename: `Smart_CV_${template}_${Date.now()}.${format}`,
//         displayName: `Smart CV - ${
//           profile.targetJob?.title || targetJob || 'General'
//         }`,
//         format: format,
//         size: generatedCV.size,
//         uploadedAt: new Date(),
//         aiGenerated: template !== 'minimal-clean' && hideIcons !== true,
//         template: template,
//         customization: customization,
//         targetJob: profile.targetJob?.title || targetJob,
//       };

//       profile.resume.history.push(newCVEntry);

//       // Set as current if requested
//       if (req.body.setAsCurrent !== false) {
//         profile.resume.current = {
//           ...newCVEntry,
//           updatedAt: new Date(),
//           aiAnalysis: generatedCV.optimization || {},
//         };
//       }

//       await profile.save();

//       return ApiResponse.success(
//         res,
//         {
//           cv: generatedCV,
//           entry: newCVEntry,
//           message: 'Smart CV generated successfully with AI enhancement',
//         },
//         'Smart CV generated successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * GET /api/candidates/me/cv-builder/templates
//    * Lấy danh sách CV templates có sẵn
//    */
//   async getTemplates(req, res, next) {
//     try {
//       const { CV_TEMPLATES } = require('../../config/cvTemplates');
//       const { industryCode, category, style } = req.query; // category kept for backward-compat only

//       let templates = Object.entries(CV_TEMPLATES).map(([key, template]) => ({
//         id: key,
//         name: template.name,
//         description: template.description,
//         preview: template.preview,
//         industryCode: template.industryCode || template.category || 'general',
//         color: template.color,
//         style: template.style,
//         sections: template.sections,
//         customization: template.customization,
//         isPopular: ['modern', 'student-tech', 'minimal'].includes(key),
//         customizable: {
//           colors: true,
//           fonts: true,
//           layout: true,
//           sections: true,
//         },
//       }));

//       // Filter by industryCode (preferred) or legacy category
//       const effectiveIndustry = industryCode || category;
//       if (effectiveIndustry) {
//         templates = templates.filter(t => t.industryCode === effectiveIndustry);
//       }

//       // Filter by style if provided
//       if (style) {
//         templates = templates.filter(t => t.style === style);
//       }

//       // Group by category
//       const groupedTemplates = templates.reduce((acc, template) => {
//         const key = template.industryCode;
//         if (!acc[key]) {
//           acc[key] = [];
//         }
//         acc[key].push(template);
//         return acc;
//       }, {});

//       return ApiResponse.success(
//         res,
//         {
//           templates,
//           groupedTemplates,
//           industries: Object.keys(groupedTemplates),
//           total: templates.length,
//         },
//         'CV templates retrieved successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/analyze-job
//    * Phân tích job description và đưa ra gợi ý tối ưu CV
//    */
//   async analyzeJobDescription(req, res, next) {
//     try {
//       const { jobDescription, targetJob, companyInfo } = req.body;

//       if (!jobDescription) {
//         throw new AppError('Job description is required', 400);
//       }

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         throw new AppError('Profile not found', 404);
//       }

//       // Analyze job description using AI
//       const analysis = await aiService.analyzeJobDescription(
//         jobDescription,
//         targetJob,
//         profile,
//         companyInfo
//       );

//       return ApiResponse.success(
//         res,
//         analysis,
//         'Job analysis completed successfully'
//       );
//     } catch (error) {
//       next(error);
//     }
//   }

//   // ========================================
//   // AI FEATURES - Tính năng AI cho CV
//   // ========================================

//   /**
//    * POST /api/candidates/me/cv-builder/ai-suggestions
//    * Lấy gợi ý AI cho các trường form
//    */
//   async getAISuggestions(req, res, next) {
//     try {
//       const { stepType, currentData, context } = req.body;

//       let suggestions = {};

//       switch (stepType) {
//         case 'targetJob':
//           suggestions = await aiService.getJobSuggestions(currentData.title);
//           break;

//         case 'careerObjective':
//           suggestions = await aiService.generateCareerObjective(
//             currentData,
//             context
//           );
//           break;

//         case 'skills':
//           suggestions = await aiService.suggestSkills(
//             context.targetJob,
//             context.experience
//           );
//           break;

//         case 'experience':
//           suggestions = await aiService.enhanceExperienceDescription(
//             currentData
//           );
//           break;

//         default:
//           return ApiResponse.error(res, 'Invalid step type', 400);
//       }

//       return ApiResponse.success(
//         res,
//         { suggestions },
//         'AI suggestions generated successfully'
//       );
//     } catch (error) {
//       console.error('AI suggestions error:', error);
//       return ApiResponse.error(res, 'Failed to generate AI suggestions', 500);
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/analyze-job-match
//    * Phân tích điểm số khớp giữa CV và job target
//    */
//   async analyzeJobMatch(req, res, next) {
//     try {
//       const { targetJobDescription, targetJobTitle } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       // Get CV data
//       const cvData = this.extractCVData(profile);

//       // Analyze match using AI
//       const analysis = await aiService.analyzeJobMatch(cvData, {
//         title: targetJobTitle,
//         description: targetJobDescription,
//       });

//       return ApiResponse.success(res, analysis, 'Job match analysis completed');
//     } catch (error) {
//       console.error('Job match analysis error:', error);
//       next(new AppError('Failed to analyze job match', 500));
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/skill-gap-analysis
//    * Phân tích khoảng cách kỹ năng giữa CV và job target
//    */
//   async getSkillGapAnalysis(req, res, next) {
//     try {
//       const { targetJobDescription, targetJobTitle, industry } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       const cvData = this.extractCVData(profile);

//       // Analyze skill gaps
//       const skillGapAnalysis = await aiService.analyzeSkillGaps(cvData, {
//         title: targetJobTitle,
//         description: targetJobDescription,
//         industry,
//       });

//       return ApiResponse.success(
//         res,
//         skillGapAnalysis,
//         'Skill gap analysis completed'
//       );
//     } catch (error) {
//       console.error('Skill gap analysis error:', error);
//       next(new AppError('Failed to analyze skill gaps', 500));
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/generate-roadmap
//    * Tạo lộ trình học tập kỹ năng cá nhân hóa
//    */
//   async generateSkillRoadmap(req, res, next) {
//     try {
//       const {
//         targetJobTitle,
//         targetJobDescription,
//         skillGaps,
//         timeframe,
//         learningPreferences,
//       } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       const cvData = this.extractCVData(profile);

//       // Generate roadmap using AI
//       const roadmap = await aiService.generateLearningRoadmap({
//         currentSkills: cvData.skills,
//         targetJob: {
//           title: targetJobTitle,
//           description: targetJobDescription,
//         },
//         skillGaps,
//         timeframe: timeframe || '12 weeks',
//         preferences: learningPreferences || {},
//       });

//       // Save roadmap to profile
//       profile.skillRoadmap = {
//         ...roadmap,
//         createdAt: new Date(),
//         targetJob: {
//           title: targetJobTitle,
//           description: targetJobDescription,
//         },
//       };

//       await profile.save();

//       return ApiResponse.success(
//         res,
//         roadmap,
//         'Learning roadmap generated successfully'
//       );
//     } catch (error) {
//       console.error('Roadmap generation error:', error);
//       next(new AppError('Failed to generate learning roadmap', 500));
//     }
//   }

//   // ========================================
//   // PDF EXPORT - Export và xem PDF
//   // ========================================

//   /**
//    * POST /api/candidates/me/cv-builder/export-pdf
//    * Export CV as PDF
//    */
//   async exportPDF(req, res, next) {
//   getEmptyBuilderData() {
//     return {
//       personalInfo: {
//         fullName: '',
//         email: '',
//         phone: '',
//         address: '',
//         dateOfBirth: null,
//         avatar: null,
//         website: '',
//         linkedin: '',
//         github: '',
//       },
//       targetJob: {
//         title: '',
//         industry: '',
//         level: 'entry',
//         salary: '',
//         location: '',
//       },
//       careerObjective: '',
//       experience: [],
//       education: [],
//       skills: { technical: [], soft: [], languages: [] },
//       projects: [],
//       certifications: [],
//       awards: [],
//       languages: [],
//       hobbies: [],
//       references: [],
//     };
//   }

//   formatAddress(address) {
//     if (!address) return '';
//     if (typeof address === 'string') return address;

//     const { street, ward, district, city, country } = address;
//     return [street, ward, district, city, country].filter(Boolean).join(', ');
//   }

//   formatExperience(experience) {
//     if (!experience) return [];

//     const allExp = [];
//     ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
//       if (experience[type]) {
//         experience[type].forEach(exp => {
//           allExp.push({
//             ...exp,
//             type: type.replace('internships', 'internship'),
//           });
//         });
//       }
//     });

//     return allExp.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
//   }

//   formatEducation(education) {
//     if (!education) return [];

//     const allEdu = [];
//     if (education.university) {
//       allEdu.push({ ...education.university, type: 'university' });
//     }
//     if (education.highSchool) {
//       allEdu.push({ ...education.highSchool, type: 'highschool' });
//     }

//     return allEdu;
//   }

//   formatSkills(skills) {
//     return {
//       technical: skills?.technical || [],
//       soft: skills?.soft || [],
//       languages: skills?.languages || [],
//     };
//   }

//   formatProjects(projects) {
//     return projects || [];
//   }

//   formatCertifications(certifications) {
//     return certifications || [];
//   }

//   formatAwards(awards) {
//     return awards || [];
//   }

//   formatLanguages(languages) {
//     return languages || [];
//   }

//   getAllExperience(experience) {
//     const allExp = [];
//     if (experience) {
//       ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
//         if (experience[type]) {
//           experience[type].forEach(exp => allExp.push(exp));
//         }
//       });
//     }
//     return allExp.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
//   }

//   getAllEducation(education) {
//     const allEdu = [];
//     if (education?.university) allEdu.push(education.university);
//     if (education?.highSchool) allEdu.push(education.highSchool);
//     return allEdu;
//   }

//   calculateCompleteness(profile) {
//     let score = 0;
//     let total = 0;

//     // Personal info (20 points)
//     total += 20;
//     if (profile.personalInfo?.fullName) score += 5;
//     if (profile.personalInfo?.email) score += 5;
//     if (profile.personalInfo?.phone) score += 5;
//     if (profile.personalInfo?.address) score += 5;

//     // Experience (25 points)
//     total += 25;
//     const allExp = this.getAllExperience(profile.experience);
//     if (allExp.length > 0) score += 15;
//     if (allExp.length >= 2) score += 10;

//     // Education (20 points)
//     total += 20;
//     if (profile.education?.university) score += 15;
//     if (profile.education?.highSchool) score += 5;

//     // Skills (20 points)
//     total += 20;
//     if (profile.skills?.technical?.length > 0) score += 10;
//     if (profile.skills?.soft?.length > 0) score += 5;
//     if (profile.skills?.languages?.length > 0) score += 5;

//     // Additional (15 points)
//     total += 15;
//     if (profile.projects?.length > 0) score += 5;
//     if (profile.certifications?.length > 0) score += 5;
//     if (profile.personalInfo?.bio) score += 5;

//     return Math.round((score / total) * 100);
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/export-pdf
//    * Export CV as PDF
//    */
//   async exportPDF(req, res, next) {
//     try {
//       const {
//         cvId,
//         cvUrl,
//         template = 'modern',
//         pdfOptions = {},
//         filename = null,
//       } = req.body;

//       if (!cvId && !cvUrl) {
//         throw new AppError('Either cvId or cvUrl is required', 400);
//       }

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         throw new AppError('Profile not found', 404);
//       }

//       let htmlContent = null;
//       let cvUrlToUse = cvUrl;

//       // If cvId is provided, get the CV from database
//       if (cvId) {
//         const cvEntry = profile.documents?.find(
//           doc => doc._id.toString() === cvId
//         );
//         if (!cvEntry) {
//           throw new AppError('CV not found', 404);
//         }
//         cvUrlToUse = cvEntry.url;
//       }

//       // Generate filename if not provided
//       const candidateName = profile.personalInfo?.fullName || 'Candidate';
//       const targetJob = profile.targetJob?.title || 'General';
//       const finalFilename =
//         filename ||
//         pdfGenerationService.generatePDFFilename(
//           candidateName,
//           targetJob,
//           template
//         );

//       // Get PDF options for template
//       const templatePDFOptions =
//         pdfGenerationService.getPDFOptionsForTemplate(template);
//       const finalPDFOptions = { ...templatePDFOptions, ...pdfOptions };

//       console.log('🔄 Exporting CV to PDF...');
//       console.log(`📄 CV URL: ${cvUrlToUse}`);
//       console.log(`📁 Filename: ${finalFilename}`);
//       console.log(`🎨 Template: ${template}`);

//       // Generate PDF from CV URL
//       const pdfResult = await pdfGenerationService.generatePDFFromCVURL(
//         cvUrlToUse,
//         finalFilename,
//         finalPDFOptions
//       );

//       // Save PDF entry to profile
//       const pdfEntry = {
//         url: pdfResult.url,
//         filename: pdfResult.filename,
//         displayName: `PDF - ${candidateName} - ${targetJob}`,
//         format: 'pdf',
//         size: pdfResult.size,
//         uploadedAt: pdfResult.uploadedAt,
//         aiGenerated: false,
//         template: template,
//         targetJob: targetJob,
//         pdfOptions: finalPDFOptions,
//       };

//       // Add to profile documents
//       if (!profile.documents) {
//         profile.documents = [];
//       }
//       profile.documents.push(pdfEntry);

//       // Save profile
//       await profile.save();

//       console.log('✅ PDF exported successfully');

//       return ApiResponse.success(
//         res,
//         {
//           pdf: pdfResult,
//           entry: pdfEntry,
//           message: 'CV exported to PDF successfully',
//         },
//         'CV exported to PDF successfully'
//       );
//     } catch (error) {
//       console.error('❌ PDF export failed:', error);
//       next(error);
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/export-pdf-direct
//    * Export CV as PDF directly from HTML content
//    */
//   async exportPDFDirect(req, res, next) {
//     try {
//       const {
//         htmlContent,
//         template = 'modern',
//         pdfOptions = {},
//         filename = null,
//       } = req.body;

//       if (!htmlContent) {
//         throw new AppError('HTML content is required', 400);
//       }

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         throw new AppError('Profile not found', 404);
//       }

//       // Generate filename if not provided
//       const candidateName = profile.personalInfo?.fullName || 'Candidate';
//       const targetJob = profile.targetJob?.title || 'General';
//       const finalFilename =
//         filename ||
//         pdfGenerationService.generatePDFFilename(
//           candidateName,
//           targetJob,
//           template
//         );

//       // Get PDF options for template
//       const templatePDFOptions =
//         pdfGenerationService.getPDFOptionsForTemplate(template);
//       const finalPDFOptions = { ...templatePDFOptions, ...pdfOptions };

//       console.log('🔄 Exporting CV to PDF directly from HTML...');
//       console.log(`📁 Filename: ${finalFilename}`);
//       console.log(`🎨 Template: ${template}`);

//       // Generate PDF from HTML content
//       const pdfResult = await pdfGenerationService.generateAndUploadPDF(
//         htmlContent,
//         finalFilename,
//         finalPDFOptions
//       );

//       // Save PDF entry to profile
//       const pdfEntry = {
//         url: pdfResult.url,
//         filename: pdfResult.filename,
//         displayName: `PDF - ${candidateName} - ${targetJob}`,
//         format: 'pdf',
//         size: pdfResult.size,
//         uploadedAt: pdfResult.uploadedAt,
//         aiGenerated: false,
//         template: template,
//         targetJob: targetJob,
//         pdfOptions: finalPDFOptions,
//       };

//       // Add to profile documents
//       if (!profile.documents) {
//         profile.documents = [];
//       }
//       profile.documents.push(pdfEntry);

//       // Save profile
//       await profile.save();

//       console.log('✅ PDF exported successfully from HTML');

//       return ApiResponse.success(
//         res,
//         {
//           pdf: pdfResult,
//           entry: pdfEntry,
//           message: 'CV exported to PDF successfully from HTML',
//         },
//         'CV exported to PDF successfully'
//       );
//     } catch (error) {
//       console.error('❌ PDF export from HTML failed:', error);
//       next(error);
//     }
//   }

//   /**
//    * GET /api/candidates/me/cv-builder/preview-pdf/:cvId
//    * Preview PDF CV
//    */
//   // previewPDF removed: use /api/candidates/me/resume/view

//   /**
//    * GET /api/candidates/me/cv-builder/pdf-viewer/:cvId
//    * Get PDF viewer data with embedded viewer
//    */
//   // getPDFViewer removed: use /api/candidates/me/resume/view

//   /**
//    * Generate PDF viewer HTML
//    * @param {Object} cvEntry - CV entry object
//    * @returns {string} HTML for PDF viewer
//    */
//   generatePDFViewerHTML(cvEntry) {
//     return `
// <!DOCTYPE html>
// <html lang="vi">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>PDF Viewer - ${cvEntry.displayName}</title>
//     <style>
//         * {
//             margin: 0;
//             padding: 0;
//             box-sizing: border-box;
//         }

//         body {
//             font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             background: #f5f5f5;
//             height: 100vh;
//             overflow: hidden;
//         }

//         .pdf-viewer-container {
//             display: flex;
//             flex-direction: column;
//             height: 100vh;
//         }

//         .pdf-header {
//             background: #2563eb;
//             color: white;
//             padding: 15px 20px;
//             display: flex;
//             justify-content: space-between;
//             align-items: center;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//         }

//         .pdf-title {
//             font-size: 1.2em;
//             font-weight: 600;
//         }

//         .pdf-actions {
//             display: flex;
//             gap: 10px;
//         }

//         .btn {
//             padding: 8px 16px;
//             border: none;
//             border-radius: 6px;
//             cursor: pointer;
//             font-size: 0.9em;
//             transition: all 0.3s ease;
//         }

//         .btn-primary {
//             background: #10b981;
//             color: white;
//         }

//         .btn-primary:hover {
//             background: #059669;
//         }

//         .btn-secondary {
//             background: rgba(255,255,255,0.2);
//             color: white;
//             border: 1px solid rgba(255,255,255,0.3);
//         }

//         .btn-secondary:hover {
//             background: rgba(255,255,255,0.3);
//         }

//         .pdf-content {
//             flex: 1;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             padding: 20px;
//         }

//         .pdf-embed {
//             width: 100%;
//             height: 100%;
//             border: none;
//             border-radius: 8px;
//             box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//             background: white;
//         }

//         .pdf-info {
//             position: absolute;
//             top: 10px;
//             right: 10px;
//             background: rgba(0,0,0,0.7);
//             color: white;
//             padding: 10px;
//             border-radius: 6px;
//             font-size: 0.8em;
//             opacity: 0;
//             transition: opacity 0.3s ease;
//         }

//         .pdf-content:hover .pdf-info {
//             opacity: 1;
//         }

//         .loading {
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             gap: 20px;
//         }

//         .spinner {
//             width: 40px;
//             height: 40px;
//             border: 4px solid #e5e7eb;
//             border-top: 4px solid #2563eb;
//             border-radius: 50%;
//             animation: spin 1s linear infinite;
//         }

//         @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//         }

//         .error-message {
//             text-align: center;
//             color: #ef4444;
//             padding: 20px;
//         }

//         @media (max-width: 768px) {
//             .pdf-header {
//                 padding: 10px 15px;
//             }

//             .pdf-title {
//                 font-size: 1em;
//             }

//             .pdf-actions {
//                 gap: 5px;
//             }

//             .btn {
//                 padding: 6px 12px;
//                 font-size: 0.8em;
//             }
//         }
//     </style>
// </head>
// <body>
//     <div class="pdf-viewer-container">
//         <div class="pdf-header">
//             <div class="pdf-title">📄 ${cvEntry.displayName}</div>
//             <div class="pdf-actions">
//                 <button class="btn btn-secondary" onclick="downloadPDF()">📥 Tải xuống</button>
//                 <button class="btn btn-primary" onclick="openInNewTab()">🔗 Mở tab mới</button>
//             </div>
//         </div>

//         <div class="pdf-content">
//             <div class="pdf-info">
//                 <div><strong>File:</strong> ${cvEntry.filename}</div>
//                 <div><strong>Kích thước:</strong> ${this.formatFileSize(
//                   cvEntry.size
//                 )}</div>
//                 <div><strong>Ngày tạo:</strong> ${new Date(
//                   cvEntry.uploadedAt
//                 ).toLocaleDateString('vi-VN')}</div>
//                 ${
//                   cvEntry.template
//                     ? `<div><strong>Template:</strong> ${cvEntry.template}</div>`
//                     : ''
//                 }
//                 ${
//                   cvEntry.targetJob
//                     ? `<div><strong>Vị trí:</strong> ${cvEntry.targetJob}</div>`
//                     : ''
//                 }
//             </div>

//             <iframe
//                 class="pdf-embed"
//                 src="${cvEntry.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH"
//                 onload="hideLoading()"
//                 onerror="showError()"
//             ></iframe>

//             <div id="loading" class="loading">
//                 <div class="spinner"></div>
//                 <div>Đang tải PDF...</div>
//             </div>

//             <div id="error" class="error-message" style="display: none;">
//                 <h3>❌ Không thể tải PDF</h3>
//                 <p>Có thể file PDF không tồn tại hoặc có lỗi kết nối.</p>
//                 <button class="btn btn-primary" onclick="retryLoad()">🔄 Thử lại</button>
//             </div>
//         </div>
//     </div>

//     <script>
//         function hideLoading() {
//             document.getElementById('loading').style.display = 'none';
//         }

//         function showError() {
//             document.getElementById('loading').style.display = 'none';
//             document.getElementById('error').style.display = 'block';
//         }

//         function retryLoad() {
//             document.getElementById('error').style.display = 'none';
//             document.getElementById('loading').style.display = 'flex';
//             location.reload();
//         }

//         function downloadPDF() {
//             const link = document.createElement('a');
//             link.href = '${cvEntry.url}';
//             link.download = '${cvEntry.filename}';
//             link.click();
//         }

//         function openInNewTab() {
//             window.open('${cvEntry.url}', '_blank');
//         }

//         // Auto-hide loading after 5 seconds
//         setTimeout(() => {
//             hideLoading();
//         }, 5000);
//     </script>
// </body>
// </html>`;
//   }

//   /**
//    * Format file size
//    * @param {number} bytes - File size in bytes
//    * @returns {string} Formatted file size
//    */
//   formatFileSize(bytes) {
//     if (bytes === 0) return '0 Bytes';

//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));

//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/ai-suggestions
//    * Get AI suggestions for form fields
//    */
//   async getAISuggestions(req, res, next) {
//     try {
//       const { stepType, currentData, context } = req.body;

//       let suggestions = {};

//       switch (stepType) {
//         case 'targetJob':
//           suggestions = await aiService.getJobSuggestions(currentData.title);
//           break;

//         case 'careerObjective':
//           suggestions = await aiService.generateCareerObjective(
//             currentData,
//             context
//           );
//           break;

//         case 'skills':
//           suggestions = await aiService.suggestSkills(
//             context.targetJob,
//             context.experience
//           );
//           break;

//         case 'experience':
//           suggestions = await aiService.enhanceExperienceDescription(
//             currentData
//           );
//           break;

//         default:
//           return ApiResponse.error(res, 'Invalid step type', 400);
//       }

//       return ApiResponse.success(
//         res,
//         { suggestions },
//         'AI suggestions generated successfully'
//       );
//     } catch (error) {
//       console.error('AI suggestions error:', error);
//       return ApiResponse.error(res, 'Failed to generate AI suggestions', 500);
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/analyze-job-match
//    * Analyze match score between CV and target job
//    */
//   async analyzeJobMatch(req, res, next) {
//     try {
//       const { targetJobDescription, targetJobTitle } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       // Get CV data
//       const cvData = this.extractCVData(profile);

//       // Analyze match using AI
//       const analysis = await aiService.analyzeJobMatch(cvData, {
//         title: targetJobTitle,
//         description: targetJobDescription,
//       });

//       return ApiResponse.success(res, analysis, 'Job match analysis completed');
//     } catch (error) {
//       console.error('Job match analysis error:', error);
//       next(new AppError('Failed to analyze job match', 500));
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/skill-gap-analysis
//    * Analyze skill gaps between CV and target job
//    */
//   async getSkillGapAnalysis(req, res, next) {
//     try {
//       const { targetJobDescription, targetJobTitle, industry } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       const cvData = this.extractCVData(profile);

//       // Analyze skill gaps
//       const skillGapAnalysis = await aiService.analyzeSkillGaps(cvData, {
//         title: targetJobTitle,
//         description: targetJobDescription,
//         industry,
//       });

//       return ApiResponse.success(
//         res,
//         skillGapAnalysis,
//         'Skill gap analysis completed'
//       );
//     } catch (error) {
//       console.error('Skill gap analysis error:', error);
//       next(new AppError('Failed to analyze skill gaps', 500));
//     }
//   }

//   /**
//    * POST /api/candidates/me/cv-builder/generate-roadmap
//    * Generate personalized skill learning roadmap
//    */
//   async generateSkillRoadmap(req, res, next) {
//     try {
//       const {
//         targetJobTitle,
//         targetJobDescription,
//         skillGaps,
//         timeframe,
//         learningPreferences,
//       } = req.body;

//       const profile = await CandidateProfile.findOne({ userId: req.user.id });
//       if (!profile) {
//         return ApiResponse.error(res, 'Profile not found', 404);
//       }

//       const cvData = this.extractCVData(profile);

//       // Generate roadmap using AI
//       const roadmap = await aiService.generateLearningRoadmap({
//         currentSkills: cvData.skills,
//         targetJob: {
//           title: targetJobTitle,
//           description: targetJobDescription,
//         },
//         skillGaps,
//         timeframe: timeframe || '12 weeks',
//         preferences: learningPreferences || {},
//       });

//       // Save roadmap to profile
//       profile.skillRoadmap = {
//         ...roadmap,
//         createdAt: new Date(),
//         targetJob: {
//           title: targetJobTitle,
//           description: targetJobDescription,
//         },
//       };

//       await profile.save();

//       return ApiResponse.success(
//         res,
//         roadmap,
//         'Learning roadmap generated successfully'
//       );
//     } catch (error) {
//       console.error('Roadmap generation error:', error);
//       next(new AppError('Failed to generate learning roadmap', 500));
//     }
//   }

//   /**
//    * Extract CV data from profile for AI analysis
//    */
//   extractCVData(profile) {
//     return {
//       personalInfo: profile.personalInfo || {},
//       skills: this.formatSkills(profile.skills || {}),
//       experience: this.getAllExperience(profile),
//       education: this.getAllEducation(profile),
//       projects: profile.projects || [],
//       certifications: profile.certifications || [],
//       summary: profile.summary || '',
//       targetJob: profile.targetJob || {},
//     };
//   }
// }

// module.exports = CVBuilderController;
