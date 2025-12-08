const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../../utils/logger');

/**
 * Template Renderer Service
 * Renders CV templates to HTML for preview and export
 */
class TemplateRenderer {
  constructor() {
    this.templatesDir = path.join(__dirname, '../../public/templates');
    this.templates = new Map();
  }

  /**
   * Load template by ID
   * @param {string} templateId - Template identifier
   * @returns {string} Template HTML
   */
  async loadTemplate(templateId) {
    try {
      // Check cache first
      if (this.templates.has(templateId)) {
        return this.templates.get(templateId);
      }

      const templatePath = path.join(this.templatesDir, `${templateId}.html`);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        logger.warn(`Template ${templateId} not found, using default`);
        return this.getDefaultTemplate();
      }

      const templateContent = await fs.readFile(templatePath, 'utf8');
      this.templates.set(templateId, templateContent);

      return templateContent;
    } catch (error) {
      logger.error('Error loading template:', error);
      return this.getDefaultTemplate();
    }
  }

  /**
   * Render CV with template
   * @param {object} cv - CV data
   * @param {object} options - Render options
   * @returns {object} Rendered result
   */
  async render(cv, options = {}) {
    try {
      const templateId = cv.templateId || 'modern';
      const template = await this.loadTemplate(templateId);

      // Apply customizations
      const customizedTemplate = this.applyCustomizations(template, cv.customization || {});

      // Render sections
      const renderedSections = this.renderSections(cv.content?.sections || []);

      // Replace placeholders
      let html = customizedTemplate
        .replace('{{personalInfo}}', this.renderPersonalInfo(cv.content?.personalInfo || {}))
        .replace('{{sections}}', renderedSections)
        .replace('{{title}}', cv.title || 'My CV');

      // Add CSS
      html = this.addStyles(html, cv.customization);

      return {
        html,
        templateId,
        renderedAt: new Date().toISOString(),
        stats: {
          sectionsCount: cv.content?.sections?.length || 0,
          wordsCount: this.countWords(html),
          templateUsed: templateId
        }
      };
    } catch (error) {
      logger.error('Error rendering CV:', error);
      throw new Error('Failed to render CV template');
    }
  }

  /**
   * Apply customizations to template
   * @param {string} template - Template HTML
   * @param {object} customization - Customization options
   * @returns {string} Customized template
   */
  applyCustomizations(template, customization) {
    let customized = template;

    // Apply colors
    if (customization.colors) {
      customized = customized.replace(/{{primaryColor}}/g, customization.colors.primary || '#2563eb');
      customized = customized.replace(/{{secondaryColor}}/g, customization.colors.secondary || '#64748b');
      customized = customized.replace(/{{accentColor}}/g, customization.colors.accent || '#10b981');
    }

    // Apply fonts
    if (customization.fonts) {
      customized = customized.replace(/{{headingFont}}/g, customization.fonts.heading || 'Inter');
      customized = customized.replace(/{{bodyFont}}/g, customization.fonts.body || 'Inter');
    }

    // Apply layout
    if (customization.layout) {
      customized = customized.replace(/{{layout}}/g, customization.layout);
    }

    return customized;
  }

  /**
   * Render personal info section
   * @param {object} personalInfo - Personal information
   * @returns {string} HTML
   */
  renderPersonalInfo(personalInfo) {
    return `
      <div class="personal-info">
        <h1 class="name">${personalInfo.fullName || 'Your Name'}</h1>
        <div class="contact-info">
          ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
          ${personalInfo.phone ? `<div class="contact-item">📱 ${personalInfo.phone}</div>` : ''}
          ${personalInfo.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ''}
        </div>
        ${personalInfo.summary ? `<p class="summary">${personalInfo.summary}</p>` : ''}
      </div>
    `;
  }

  /**
   * Render CV sections
   * @param {Array} sections - CV sections
   * @returns {string} HTML
   */
  renderSections(sections) {
    return sections.map(section => {
      switch (section.type) {
        case 'experience':
          return this.renderExperienceSection(section);
        case 'education':
          return this.renderEducationSection(section);
        case 'skills':
          return this.renderSkillsSection(section);
        case 'projects':
          return this.renderProjectsSection(section);
        default:
          return this.renderGenericSection(section);
      }
    }).join('');
  }

  /**
   * Render experience section
   * @param {object} section - Section data
   * @returns {string} HTML
   */
  renderExperienceSection(section) {
    const items = section.content?.items || [];
    return `
      <section class="cv-section experience-section">
        <h2 class="section-title">${section.title || 'Work Experience'}</h2>
        ${items.map(item => `
          <div class="experience-item">
            <div class="job-header">
              <h3 class="job-title">${item.title || 'Job Title'}</h3>
              <div class="company-info">
                <span class="company">${item.company || 'Company'}</span>
                ${item.location ? `<span class="location">• ${item.location}</span>` : ''}
              </div>
            </div>
            ${item.duration ? `<div class="duration">${item.duration}</div>` : ''}
            ${item.description ? `<p class="description">${item.description}</p>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * Render education section
   * @param {object} section - Section data
   * @returns {string} HTML
   */
  renderEducationSection(section) {
    const items = section.content?.items || [];
    return `
      <section class="cv-section education-section">
        <h2 class="section-title">${section.title || 'Education'}</h2>
        ${items.map(item => `
          <div class="education-item">
            <div class="degree-header">
              <h3 class="degree">${item.degree || 'Degree'}</h3>
              <div class="school-info">
                <span class="school">${item.school || 'School'}</span>
                ${item.location ? `<span class="location">• ${item.location}</span>` : ''}
              </div>
            </div>
            ${item.duration ? `<div class="duration">${item.duration}</div>` : ''}
            ${item.gpa ? `<div class="gpa">GPA: ${item.gpa}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * Render skills section
   * @param {object} section - Section data
   * @returns {string} HTML
   */
  renderSkillsSection(section) {
    const skills = section.content?.skills || [];
    return `
      <section class="cv-section skills-section">
        <h2 class="section-title">${section.title || 'Skills'}</h2>
        <div class="skills-grid">
          ${skills.map(skill => `
            <div class="skill-item">
              <span class="skill-name">${skill.name || 'Skill'}</span>
              ${skill.level ? `<span class="skill-level">${skill.level}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render projects section
   * @param {object} section - Section data
   * @returns {string} HTML
   */
  renderProjectsSection(section) {
    const items = section.content?.items || [];
    return `
      <section class="cv-section projects-section">
        <h2 class="section-title">${section.title || 'Projects'}</h2>
        ${items.map(item => `
          <div class="project-item">
            <div class="project-header">
              <h3 class="project-name">${item.name || 'Project Name'}</h3>
              ${item.technologies ? `<div class="technologies">${item.technologies.join(', ')}</div>` : ''}
            </div>
            ${item.description ? `<p class="description">${item.description}</p>` : ''}
            ${item.url ? `<a href="${item.url}" class="project-link">View Project</a>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  /**
   * Render generic section
   * @param {object} section - Section data
   * @returns {string} HTML
   */
  renderGenericSection(section) {
    return `
      <section class="cv-section generic-section">
        <h2 class="section-title">${section.title || 'Section'}</h2>
        ${section.content?.text ? `<p>${section.content.text}</p>` : ''}
      </section>
    `;
  }

  /**
   * Add CSS styles to HTML
   * @param {string} html - HTML content
   * @param {object} customization - Customization options
   * @returns {string} HTML with styles
   */
  addStyles(html, customization = {}) {
    const primaryColor = customization.colors?.primary || '#2563eb';
    const secondaryColor = customization.colors?.secondary || '#64748b';
    const accentColor = customization.colors?.accent || '#10b981';
    const headingFont = customization.fonts?.heading || 'Inter';
    const bodyFont = customization.fonts?.body || 'Inter';

    const css = `
      <style>
        .cv-container {
          font-family: '${bodyFont}', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          color: #333;
          line-height: 1.6;
        }

        .personal-info {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 30px;
        }

        .name {
          font-family: '${headingFont}', serif;
          font-size: 2.5em;
          color: ${primaryColor};
          margin: 0 0 10px 0;
          font-weight: bold;
        }

        .contact-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin: 15px 0;
        }

        .contact-item {
          color: ${secondaryColor};
          font-size: 0.9em;
        }

        .summary {
          font-style: italic;
          color: #666;
          margin-top: 15px;
        }

        .cv-section {
          margin-bottom: 30px;
        }

        .section-title {
          font-family: '${headingFont}', serif;
          font-size: 1.5em;
          color: ${primaryColor};
          border-bottom: 1px solid ${accentColor};
          padding-bottom: 5px;
          margin-bottom: 20px;
        }

        .experience-item, .education-item, .project-item {
          margin-bottom: 25px;
        }

        .job-title, .degree, .project-name {
          font-size: 1.2em;
          color: ${primaryColor};
          margin: 0 0 5px 0;
        }

        .company, .school {
          font-weight: bold;
          color: #333;
        }

        .duration {
          color: ${secondaryColor};
          font-size: 0.9em;
          margin: 5px 0;
        }

        .description {
          margin: 10px 0;
          text-align: justify;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }

        .skill-item {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 4px;
          border-left: 3px solid ${accentColor};
        }

        .skill-name {
          font-weight: bold;
        }

        .skill-level {
          color: ${secondaryColor};
          font-size: 0.8em;
        }

        .technologies {
          color: ${secondaryColor};
          font-size: 0.9em;
          margin: 5px 0;
        }

        .project-link {
          color: ${primaryColor};
          text-decoration: none;
          font-weight: bold;
        }

        .project-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .cv-container {
            padding: 20px;
          }

          .contact-info {
            flex-direction: column;
            gap: 10px;
          }

          .skills-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    return html.replace('</head>', `${css}</head>`);
  }

  /**
   * Get default template
   * @returns {string} Default HTML template
   */
  getDefaultTemplate() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}}</title>
      </head>
      <body>
        <div class="cv-container">
          {{personalInfo}}
          {{sections}}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Count words in HTML content
   * @param {string} html - HTML content
   * @returns {number} Word count
   */
  countWords(html) {
    // Remove HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  }
}

module.exports = new TemplateRenderer();