const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../config/logger');

/**
 * ResumeGeneratorService - Handles resume generation with multiple HTML templates
 * Infrastructure Layer Service following Clean Architecture
 */
class ResumeGeneratorService {
  constructor() {
    this.templatesPath = path.join(__dirname, 'templates');
    this.availableTemplates = [
      'modern',
      'classic',
      'creative',
      'minimal',
      'executive',
      'student-tech',
      'business-professional',
    ];
  }

  /**
   * Generate resume HTML using specified template
   * @param {Object} resumeData - Resume data object
   * @param {string} templateName - Template name (default: 'modern')
   * @returns {Promise<string>} Generated HTML
   */
  async generateResume(resumeData, templateName = 'modern') {
    try {
      if (!this.availableTemplates.includes(templateName)) {
        throw new Error(
          `Template '${templateName}' not found. Available templates: ${this.availableTemplates.join(
            ', '
          )}`
        );
      }

      const templatePath = path.join(
        this.templatesPath,
        `${templateName}.html`
      );
      let template = await this._loadTemplate(templatePath);

      // Replace placeholders with actual data
      template = this._populateTemplate(template, resumeData);

      return template;
    } catch (error) {
      logger.error('Resume generation error:', error);
      throw new Error(`Failed to generate resume: ${error.message}`);
    }
  }

  /**
   * Load HTML template from file
   * @private
   */
  async _loadTemplate(templatePath) {
    try {
      const template = await fs.readFile(templatePath, 'utf8');
      return template;
    } catch (error) {
      logger.error('Template loading error:', error);
      throw new Error(`Failed to load template: ${templatePath}`);
    }
  }

  /**
   * Populate template with resume data
   * @private
   */
  _populateTemplate(template, data) {
    let populated = template;

    // Basic information
    populated = populated.replace(/\{\{fullName\}\}/g, data.fullName || '');
    populated = populated.replace(/\{\{email\}\}/g, data.email || '');
    populated = populated.replace(/\{\{phone\}\}/g, data.phone || '');
    populated = populated.replace(/\{\{address\}\}/g, data.address || '');
    populated = populated.replace(/\{\{linkedin\}\}/g, data.linkedin || '');
    populated = populated.replace(/\{\{github\}\}/g, data.github || '');
    populated = populated.replace(/\{\{website\}\}/g, data.website || '');

    // Career objective
    populated = populated.replace(
      /\{\{careerObjective\}\}/g,
      data.careerObjective || ''
    );

    // Skills
    populated = populated.replace(
      /\{\{technicalSkills\}\}/g,
      this._formatSkills(data.technicalSkills || [])
    );
    populated = populated.replace(
      /\{\{softSkills\}\}/g,
      this._formatSkills(data.softSkills || [])
    );
    populated = populated.replace(
      /\{\{tools\}\}/g,
      this._formatSkills(data.tools || [])
    );

    // Experience
    populated = populated.replace(
      /\{\{experience\}\}/g,
      this._formatExperience(data.experience || [])
    );

    // Education
    populated = populated.replace(
      /\{\{education\}\}/g,
      this._formatEducation(data.education || [])
    );

    // Projects
    populated = populated.replace(
      /\{\{projects\}\}/g,
      this._formatProjects(data.projects || [])
    );

    // Certifications
    populated = populated.replace(
      /\{\{certifications\}\}/g,
      this._formatCertifications(data.certifications || [])
    );

    // Languages
    populated = populated.replace(
      /\{\{languages\}\}/g,
      this._formatLanguages(data.languages || [])
    );

    return populated;
  }

  /**
   * Format skills list
   * @private
   */
  _formatSkills(skills) {
    if (!Array.isArray(skills) || skills.length === 0) {
      return '<li>No skills listed</li>';
    }

    return skills
      .map(skill => {
        const level = skill.level || 'intermediate';
        const levelClass = `skill-${level}`;
        return `<li class="${levelClass}">${skill.name} <span class="skill-level">${level}</span></li>`;
      })
      .join('');
  }

  /**
   * Format experience section
   * @private
   */
  _formatExperience(experience) {
    if (!Array.isArray(experience) || experience.length === 0) {
      return '<div class="experience-item"><p>No experience listed</p></div>';
    }

    return experience
      .map(
        exp => `
      <div class="experience-item">
        <h4>${exp.position || ''} at ${exp.company || ''}</h4>
        <p class="date">${exp.startDate || ''} - ${exp.endDate || 'Present'}</p>
        <p class="description">${exp.description || ''}</p>
        <ul class="achievements">
          ${(exp.achievements || [])
            .map(achievement => `<li>${achievement}</li>`)
            .join('')}
        </ul>
      </div>
    `
      )
      .join('');
  }

  /**
   * Format education section
   * @private
   */
  _formatEducation(education) {
    if (!Array.isArray(education) || education.length === 0) {
      return '<div class="education-item"><p>No education listed</p></div>';
    }

    return education
      .map(
        edu => `
      <div class="education-item">
        <h4>${edu.degree || ''} in ${edu.field || ''}</h4>
        <p class="institution">${edu.institution || ''}</p>
        <p class="date">${edu.startDate || ''} - ${edu.endDate || ''}</p>
        <p class="gpa">${edu.gpa ? `GPA: ${edu.gpa}` : ''}</p>
      </div>
    `
      )
      .join('');
  }

  /**
   * Format projects section
   * @private
   */
  _formatProjects(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      return '<div class="project-item"><p>No projects listed</p></div>';
    }

    return projects
      .map(
        project => `
      <div class="project-item">
        <h4>${project.name || ''}</h4>
        <p class="technologies">${(project.technologies || []).join(', ')}</p>
        <p class="description">${project.description || ''}</p>
        <p class="link">${
          project.link ? `<a href="${project.link}">View Project</a>` : ''
        }</p>
      </div>
    `
      )
      .join('');
  }

  /**
   * Format certifications section
   * @private
   */
  _formatCertifications(certifications) {
    if (!Array.isArray(certifications) || certifications.length === 0) {
      return '<li>No certifications listed</li>';
    }

    return certifications
      .map(
        cert =>
          `<li>${cert.name || ''} - ${cert.issuer || ''} (${
            cert.date || ''
          })</li>`
      )
      .join('');
  }

  /**
   * Format languages section
   * @private
   */
  _formatLanguages(languages) {
    if (!Array.isArray(languages) || languages.length === 0) {
      return '<li>No languages listed</li>';
    }

    return languages
      .map(lang => `<li>${lang.name || ''} - ${lang.proficiency || ''}</li>`)
      .join('');
  }

  /**
   * Get available templates
   * @returns {string[]} Array of available template names
   */
  getAvailableTemplates() {
    return [...this.availableTemplates];
  }

  /**
   * Validate template exists
   * @param {string} templateName - Template name to validate
   * @returns {boolean} True if template exists
   */
  templateExists(templateName) {
    return this.availableTemplates.includes(templateName);
  }

  /**
   * Generate preview data for template testing
   * @returns {Object} Sample resume data
   */
  getPreviewData() {
    return {
      fullName: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '+84 123 456 789',
      address: 'Hà Nội, Việt Nam',
      linkedin: 'linkedin.com/in/nguyenvana',
      github: 'github.com/nguyenvana',
      website: 'nguyenvana.dev',
      careerObjective:
        'Full Stack Developer với 2 năm kinh nghiệm, chuyên về React và Node.js',
      technicalSkills: [
        { name: 'JavaScript', level: 'advanced' },
        { name: 'React', level: 'advanced' },
        { name: 'Node.js', level: 'intermediate' },
        { name: 'Python', level: 'intermediate' },
      ],
      softSkills: [
        { name: 'Communication', level: 'advanced' },
        { name: 'Teamwork', level: 'advanced' },
        { name: 'Problem Solving', level: 'intermediate' },
      ],
      tools: [
        { name: 'Git', level: 'advanced' },
        { name: 'Docker', level: 'intermediate' },
        { name: 'VS Code', level: 'advanced' },
      ],
      experience: [
        {
          position: 'Frontend Developer',
          company: 'Tech Company',
          startDate: '2022-01',
          endDate: 'Present',
          description:
            'Phát triển giao diện người dùng với React và TypeScript',
          achievements: [
            'Tối ưu performance ứng dụng, giảm loading time 40%',
            'Implement responsive design cho mobile và desktop',
          ],
        },
      ],
      education: [
        {
          degree: 'Bachelor',
          field: 'Computer Science',
          institution: 'Đại học Công nghệ',
          startDate: '2018-09',
          endDate: '2022-06',
          gpa: '3.8/4.0',
        },
      ],
      projects: [
        {
          name: 'E-commerce Platform',
          technologies: ['React', 'Node.js', 'MongoDB'],
          description: 'Nền tảng thương mại điện tử với payment integration',
          link: 'github.com/nguyenvana/ecommerce',
        },
      ],
      certifications: [
        { name: 'AWS Certified Developer', issuer: 'Amazon', date: '2023-05' },
        {
          name: 'React Developer Certification',
          issuer: 'Meta',
          date: '2023-03',
        },
      ],
      languages: [
        { name: 'Vietnamese', proficiency: 'Native' },
        { name: 'English', proficiency: 'Advanced' },
      ],
    };
  }
}

module.exports = new ResumeGeneratorService();
