const { logger } = require('../../utils/logger');
const CV_TEMPLATES = require('../../config/cvTemplates');

/**
 * CV Builder Service
 * Core logic for CV creation, editing, and management
 */

class CVBuilderService {
  /**
   * Initialize CV with template
   */
  async initializeCV(templateId, userProfile) {
    const template = CV_TEMPLATES[templateId] || CV_TEMPLATES.modern;

    const cvData = {
      templateId,
      content: {
        personalInfo: this.extractPersonalInfo(userProfile),
        sections: this.generateDefaultSections(template.sections)
      },
      customization: template.customization || {
        colors: { primary: '#2563eb', secondary: '#64748b' },
        fonts: { heading: 'Inter', body: 'Inter' },
        layout: 'two-column'
      }
    };

    return cvData;
  }

  /**
   * Extract personal info from user profile
   */
  extractPersonalInfo(userProfile) {
    return {
      fullName: userProfile.fullName || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      linkedin: userProfile.linkedin || '',
      github: userProfile.github || '',
      website: userProfile.website || '',
      photo: userProfile.photo || '',
      summary: userProfile.summary || ''
    };
  }

  /**
   * Generate default sections based on template
   */
  generateDefaultSections(templateSections) {
    const sections = [];

    templateSections.forEach(sectionType => {
      const section = this.createDefaultSection(sectionType);
      if (section) {
        sections.push(section);
      }
    });

    return sections;
  }

  /**
   * Create default section content
   */
  createDefaultSection(sectionType) {
    const sectionTemplates = {
      personalInfo: {
        id: 'personal-info',
        type: 'personalInfo',
        title: 'Personal Information',
        content: {},
        position: { x: 0, y: 0 },
        size: { width: 400, height: 200 }
      },
      careerObjective: {
        id: 'career-objective',
        type: 'careerObjective',
        title: 'Career Objective',
        content: { text: '' },
        position: { x: 0, y: 200 },
        size: { width: 400, height: 150 }
      },
      experience: {
        id: 'experience',
        type: 'experience',
        title: 'Work Experience',
        content: { items: [] },
        position: { x: 0, y: 350 },
        size: { width: 400, height: 300 }
      },
      education: {
        id: 'education',
        type: 'education',
        title: 'Education',
        content: { items: [] },
        position: { x: 0, y: 650 },
        size: { width: 400, height: 250 }
      },
      skills: {
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        content: { categories: [] },
        position: { x: 400, y: 0 },
        size: { width: 400, height: 200 }
      },
      projects: {
        id: 'projects',
        type: 'projects',
        title: 'Projects',
        content: { items: [] },
        position: { x: 400, y: 200 },
        size: { width: 400, height: 250 }
      }
    };

    return sectionTemplates[sectionType] || null;
  }

  /**
   * Validate CV structure
   */
  validateCV(cvData) {
    const errors = [];

    // Check required fields
    if (!cvData.templateId) {
      errors.push('Template ID is required');
    }

    if (!cvData.content || !cvData.content.personalInfo) {
      errors.push('Personal information is required');
    }

    // Validate sections
    if (cvData.content.sections) {
      cvData.content.sections.forEach((section, index) => {
        if (!section.id) {
          errors.push(`Section ${index} missing ID`);
        }
        if (!section.type) {
          errors.push(`Section ${index} missing type`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate CV completeness score
   */
  calculateCompleteness(cvData) {
    let score = 0;
    let totalFields = 0;

    // Personal info (30%)
    const personalInfo = cvData.content?.personalInfo || {};
    const personalFields = ['fullName', 'email', 'phone'];
    const personalComplete = personalFields.filter(field => personalInfo[field]).length;
    score += (personalComplete / personalFields.length) * 30;
    totalFields += 30;

    // Sections (70%)
    const sections = cvData.content?.sections || [];
    const sectionWeight = 70 / Math.max(sections.length, 1);

    sections.forEach(section => {
      let sectionScore = 0;

      switch (section.type) {
        case 'experience':
          sectionScore = section.content?.items?.length > 0 ? 1 : 0;
          break;
        case 'education':
          sectionScore = section.content?.items?.length > 0 ? 1 : 0;
          break;
        case 'skills':
          sectionScore = section.content?.categories?.length > 0 ? 1 : 0;
          break;
        case 'projects':
          sectionScore = section.content?.items?.length > 0 ? 1 : 0;
          break;
        case 'careerObjective':
          sectionScore = section.content?.text?.length > 50 ? 1 : 0;
          break;
        default:
          sectionScore = 1; // Other sections are considered complete if they exist
      }

      score += sectionScore * sectionWeight;
    });

    return Math.round(score);
  }

  /**
   * Get CV statistics
   */
  getCVStats(cvData) {
    const stats = {
      sectionsCount: 0,
      wordsCount: 0,
      charactersCount: 0,
      completenessScore: 0,
      estimatedReadingTime: 0
    };

    if (cvData.content) {
      // Count sections
      stats.sectionsCount = cvData.content.sections?.length || 0;

      // Count words and characters
      const contentText = this.extractTextContent(cvData.content);
      stats.wordsCount = contentText.split(/\s+/).filter(word => word.length > 0).length;
      stats.charactersCount = contentText.length;

      // Calculate completeness
      stats.completenessScore = this.calculateCompleteness(cvData);

      // Estimate reading time (200 words per minute)
      stats.estimatedReadingTime = Math.ceil(stats.wordsCount / 200);
    }

    return stats;
  }

  /**
   * Extract text content for analysis
   */
  extractTextContent(content) {
    let text = '';

    // Personal info
    if (content.personalInfo) {
      text += `${content.personalInfo.fullName} ${content.personalInfo.summary} `;
    }

    // Sections
    if (content.sections) {
      content.sections.forEach(section => {
        text += `${section.title} `;

        switch (section.type) {
          case 'experience':
          case 'education':
          case 'projects':
            if (section.content?.items) {
              section.content.items.forEach(item => {
                text += `${item.title} ${item.description} `;
              });
            }
            break;
          case 'skills':
            if (section.content?.categories) {
              section.content.categories.forEach(category => {
                text += `${category.name} ${category.skills?.join(' ')} `;
              });
            }
            break;
          case 'careerObjective':
            text += `${section.content?.text} `;
            break;
        }
      });
    }

    return text.trim();
  }

  /**
   * Optimize CV layout
   */
  optimizeLayout(cvData) {
    const sections = cvData.content?.sections || [];
    const layout = cvData.customization?.layout || 'two-column';

    if (layout === 'two-column') {
      // Arrange sections in two columns
      const leftColumn = [];
      const rightColumn = [];
      let leftHeight = 0;
      let rightHeight = 0;

      sections.forEach(section => {
        const sectionHeight = section.size?.height || 200;

        // Balance columns by height
        if (leftHeight <= rightHeight) {
          leftColumn.push({
            ...section,
            position: { x: 0, y: leftHeight }
          });
          leftHeight += sectionHeight + 20; // 20px gap
        } else {
          rightColumn.push({
            ...section,
            position: { x: 400, y: rightHeight }
          });
          rightHeight += sectionHeight + 20;
        }
      });

      return [...leftColumn, ...rightColumn];
    }

    // Single column layout
    let currentY = 0;
    return sections.map(section => ({
      ...section,
      position: { x: 0, y: currentY },
      size: { ...section.size, width: 800 }
    }));
  }

  /**
   * Generate CV preview data
   */
  generatePreview(cvData) {
    const optimizedSections = this.optimizeLayout(cvData);
    const stats = this.getCVStats(cvData);

    return {
      ...cvData,
      content: {
        ...cvData.content,
        sections: optimizedSections
      },
      metadata: {
        stats,
        lastModified: new Date(),
        version: 'preview'
      }
    };
  }
}

module.exports = new CVBuilderService();</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\src\services\resume\cvBuilderService.js