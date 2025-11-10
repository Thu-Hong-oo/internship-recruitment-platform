const { uploadFile } = require('./fileUploadService');
const aiService = require('./aiService');

/**
 * Generate resume based on candidate profile
 * @param {Object} candidateProfile - Candidate profile data
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated resume data
 */
async function generateResume(candidateProfile, options = {}) {
  try {
    const {
      template = 'modern',
      targetJob = null,
      format = 'pdf',
      includePhoto = false,
    } = options;

    // Build resume content
    const resumeContent = buildResumeContent(candidateProfile, {
      targetJob,
      includePhoto,
    });

    // Generate resume file
    let generatedResume;

    try {
      // Try to use AI service for advanced generation
      if (aiService && typeof aiService.generateResume === 'function') {
        generatedResume = await aiService.generateResume(resumeContent, {
          template,
          format,
          targetJob,
        });
      } else {
        // Fallback: Generate basic HTML/text resume
        generatedResume = await generateBasicResume(resumeContent, template);
      }
    } catch (aiError) {
      console.log(
        'AI generation failed, using basic generation:',
        aiError.message
      );
      generatedResume = await generateBasicResume(resumeContent, template);
    }

    return {
      success: true,
      data: {
        ...generatedResume,
        template,
        targetJob,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Resume generation error:', error);
    throw new Error(`Failed to generate resume: ${error.message}`);
  }
}

/**
 * Build resume content from candidate profile
 * @param {Object} candidateProfile - Candidate profile data
 * @param {Object} options - Build options
 * @returns {Object} Structured resume content
 */
function buildResumeContent(candidateProfile, options = {}) {
  const { targetJob, includePhoto } = options;

  const content = {
    personalInfo: {
      fullName: candidateProfile.personalInfo?.fullName || 'N/A',
      email: candidateProfile.userId?.email || 'N/A',
      phone: candidateProfile.personalInfo?.phone || 'N/A',
      address: formatAddress(candidateProfile.personalInfo?.address),
      bio: candidateProfile.personalInfo?.bio || '',
      ...(includePhoto &&
        candidateProfile.personalInfo?.avatar && {
          avatar: candidateProfile.personalInfo.avatar,
        }),
    },

    education: candidateProfile.education || [],

    experience: candidateProfile.experience || [],

    skills: {
      technical: candidateProfile.skills?.technical || [],
      soft: candidateProfile.skills?.soft || [],
      languages: candidateProfile.skills?.languages || [],
    },

    projects: candidateProfile.projects || [],

    certifications: candidateProfile.certifications || [],

    // Add career objective if targeting specific job
    ...(targetJob && {
      objective: generateObjective(candidateProfile, targetJob),
    }),
  };

  return content;
}

/**
 * Generate basic HTML resume
 * @param {Object} content - Resume content
 * @param {string} template - Template name
 * @returns {Promise<Object>} Generated resume data
 */
async function generateBasicResume(content, template) {
  const html = generateHTMLResume(content, template);

  // For now, just return the HTML. In production, you might want to convert to PDF
  const fileName = `resume_${Date.now()}.html`;

  // Upload the HTML file
  const uploadResult = await uploadFile('document', Buffer.from(html, 'utf8'), {
    // For raw uploads via stream, Cloudinary infers format from public_id extension
    public_id: `generated_resume_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.html`,
    resource_type: 'raw',
    use_filename: true,
    unique_filename: false,
    filename_override: fileName,
  });

  return {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
    format: 'html',
    size: uploadResult.bytes,
    content: html,
  };
}

/**
 * Generate HTML resume content
 * @param {Object} content - Resume content
 * @param {string} template - Template name
 * @returns {string} HTML content
 */
function generateHTMLResume(content, template) {
  const styles = getTemplateStyles(template);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${content.personalInfo.fullName}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="resume-container">
        <!-- Header -->
        <header class="header">
            <h1>${content.personalInfo.fullName}</h1>
            <div class="contact-info">
                <p>${content.personalInfo.email} | ${
    content.personalInfo.phone
  }</p>
                <p>${content.personalInfo.address}</p>
            </div>
            ${
              content.personalInfo.bio
                ? `<p class="bio">${content.personalInfo.bio}</p>`
                : ''
            }
        </header>

        <!-- Education -->
        ${
          content.education.length > 0
            ? `
        <section class="section">
            <h2>Education</h2>
            ${content.education
              .map(
                edu => `
                <div class="item">
                    <h3>${edu.institution || 'N/A'}</h3>
                    <p><strong>${edu.degree || 'N/A'}</strong> in ${
                  edu.field || 'N/A'
                }</p>
                    <p class="dates">${formatDateRange(
                      edu.startDate,
                      edu.endDate
                    )}</p>
                    ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Experience -->
        ${
          content.experience.length > 0
            ? `
        <section class="section">
            <h2>Experience</h2>
            ${content.experience
              .map(
                exp => `
                <div class="item">
                    <h3>${exp.title || 'N/A'}</h3>
                    <p><strong>${exp.company || 'N/A'}</strong></p>
                    <p class="dates">${formatDateRange(
                      exp.startDate,
                      exp.endDate
                    )}</p>
                    <p>${exp.description || ''}</p>
                    ${
                      exp.skills && exp.skills.length > 0
                        ? `
                        <p><strong>Skills:</strong> ${exp.skills.join(', ')}</p>
                    `
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Skills -->
        <section class="section">
            <h2>Skills</h2>
            ${
              content.skills.technical.length > 0
                ? `
                <div class="skill-category">
                    <h4>Technical Skills</h4>
                    <p>${content.skills.technical
                      .map(skill => skill.name || skill)
                      .join(', ')}</p>
                </div>
            `
                : ''
            }
            ${
              content.skills.soft.length > 0
                ? `
                <div class="skill-category">
                    <h4>Soft Skills</h4>
                    <p>${content.skills.soft
                      .map(skill => skill.name || skill)
                      .join(', ')}</p>
                </div>
            `
                : ''
            }
            ${
              content.skills.languages.length > 0
                ? `
                <div class="skill-category">
                    <h4>Languages</h4>
                    <p>${content.skills.languages
                      .map(skill =>
                        typeof skill === 'object'
                          ? `${skill.name} (${skill.level})`
                          : skill
                      )
                      .join(', ')}</p>
                </div>
            `
                : ''
            }
        </section>

        <!-- Projects -->
        ${
          content.projects.length > 0
            ? `
        <section class="section">
            <h2>Projects</h2>
            ${content.projects
              .map(
                project => `
                <div class="item">
                    <h3>${project.name || 'N/A'}</h3>
                    <p>${project.description || ''}</p>
                    ${
                      project.technologies && project.technologies.length > 0
                        ? `
                        <p><strong>Technologies:</strong> ${project.technologies.join(
                          ', '
                        )}</p>
                    `
                        : ''
                    }
                    ${
                      project.url
                        ? `<p><a href="${project.url}" target="_blank">View Project</a></p>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }

        <!-- Certifications -->
        ${
          content.certifications.length > 0
            ? `
        <section class="section">
            <h2>Certifications</h2>
            ${content.certifications
              .map(
                cert => `
                <div class="item">
                    <h3>${cert.name || 'N/A'}</h3>
                    <p><strong>${cert.issuer || 'N/A'}</strong></p>
                    <p class="dates">Issued: ${formatDate(cert.issueDate)}</p>
                    ${
                      cert.credentialUrl
                        ? `<p><a href="${cert.credentialUrl}" target="_blank">View Credential</a></p>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </section>
        `
            : ''
        }
    </div>
</body>
</html>`;
}

/**
 * Get CSS styles for template
 * @param {string} template - Template name
 * @returns {string} CSS styles
 */
function getTemplateStyles(template) {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
    .resume-container { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; color: #2c3e50; }
    .contact-info p { margin: 5px 0; font-size: 1.1em; }
    .bio { margin-top: 15px; font-style: italic; font-size: 1.1em; color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 1.5em; margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .item { margin-bottom: 20px; }
    .item h3 { font-size: 1.2em; margin-bottom: 5px; color: #34495e; }
    .item h4 { font-size: 1.1em; margin-bottom: 5px; color: #34495e; }
    .dates { color: #666; font-style: italic; }
    .skill-category { margin-bottom: 15px; }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `;

  if (template === 'modern') {
    return (
      baseStyles +
      `
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -40px -40px 30px -40px; padding: 40px; }
      .header h1 { color: white; }
      .section h2 { color: #667eea; }
    `
    );
  }

  return baseStyles;
}

/**
 * Helper functions
 */
function formatAddress(address) {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;

  const { street, ward, district, city, country } = address;
  return [street, ward, district, city, country].filter(Boolean).join(', ');
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  return `${start} - ${end}`;
}

function generateObjective(candidateProfile, targetJob) {
  return `Motivated ${
    candidateProfile.personalInfo?.fullName || 'professional'
  } seeking a ${targetJob} position to utilize my skills and contribute to organizational success.`;
}

/**
 * Parse resume from URL to extract structured data
 * @param {string} resumeUrl - URL of the resume file
 * @returns {Promise<Object>} Parsed resume data
 */
async function parseResume(resumeUrl) {
  try {
    console.log('Parsing resume from URL:', resumeUrl);

    // Try to use AI service for parsing
    if (aiService && typeof aiService.parseResume === 'function') {
      const parseResult = await aiService.parseResume(resumeUrl);
      return parseResult;
    } else {
      // Fallback: Return mock parsed data for development
      console.warn('AI service not available, returning mock parsed data');
      return generateMockParsedData();
    }
  } catch (error) {
    console.error('Resume parsing failed:', error.message);

    // Return mock data even on error for development
    return generateMockParsedData();
  }
}

/**
 * Generate mock parsed data for development/testing
 */
function generateMockParsedData() {
  return {
    extractedData: {
      personalInfo: {
        fullName: 'Nguyễn Thị Thu Hậu',
        email: 'thuhau00603@gmail.com',
        phone: '0397970553',
        address: 'Phường Gò Vấp, TP. Hồ Chí Minh',
      },
      education: [
        {
          type: 'university',
          institution: 'Đại học Sài Gòn',
          degree: 'Cử nhân',
          field: 'Kinh doanh quốc tế',
          graduationYear: 2025,
          startDate: '2021-08',
          endDate: '2025-06',
          isCurrentlyStudying: true,
          gpa: null,
        },
      ],
      experience: [
        {
          type: 'internship',
          company: 'Công ty TNHH một thành viên Vận tải Hoàng Phát',
          position: 'Thực tập sinh chứng từ',
          location: 'TP. Hồ Chí Minh',
          startDate: '2024-12',
          endDate: '2025-04',
          isCurrentPosition: false,
          description:
            'Tìm hiểu quy trình xử lý hồ hàng xuất nhập khẩu từ các chứng từ liên quan',
          achievements: [
            'Quản sát quy trình làm việc và cách phối hợp giữa các bộ phận',
            'Chủ động nghiên cứu tài liệu nội bộ và ngoại bộ học uy tín',
          ],
          technologies: ['Excel', 'Word', 'PowerPoint'],
        },
      ],
      skills: [
        {
          name: 'Tin học văn phòng MOS',
          type: 'technical',
          level: 'intermediate',
          experience: '2024',
        },
        {
          name: 'Tiếng Anh TOEIC 600',
          type: 'language',
          level: 'intermediate',
          experience: '2025',
        },
        {
          name: 'Kỹ năng giao tiếp',
          type: 'soft',
          level: 'intermediate',
        },
      ],
    },
    skills: [
      'Tin học văn phòng MOS',
      'Tiếng Anh TOEIC 600',
      'Kỹ năng giao tiếp',
      'Kỹ năng làm việc nhóm',
      'Quản lý hồ sơ',
      'Xử lý chứng từ',
      'Kinh doanh quốc tế',
    ],
    experience: [
      'Thực tập sinh chứng từ tại Công ty TNHH một thành viên Vận tải Hoàng Phát',
    ],
    education: [
      'Cử nhân Kinh doanh quốc tế - Đại học Sài Gòn (Tốt nghiệp loại Giỏi)',
    ],
    suggestions: [
      'Thêm thông tin chi tiết về các dự án cụ thể trong thời gian thực tập',
      'Mở rộng kỹ năng chuyên môn liên quan đến xuất nhập khẩu và logistics',
      'Thêm các khóa học bổ sung về thương mại điện tử hoặc marketing số',
      'Cập nhật điểm số GPA để tăng tính cạnh tranh',
    ],
  };
}

module.exports = {
  generateResume,
  parseResume,
  buildResumeContent,
  generateBasicResume,
};
