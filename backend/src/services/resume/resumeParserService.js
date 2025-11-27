const { uploadFile } = require('../upload/fileUploadService');
const aiService = require('../ai/aiService');

/**
 * Parse resume using AI service
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Parsed resume data
 */
async function parseResume(fileBuffer, filename) {
  try {
    // Upload resume to Cloudinary
    const uploadResult = await uploadFile('document', fileBuffer, {
      public_id: `resume_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      overwrite: true,
    });

    // Extract text from resume using AI service (if available)
    let extractedData = {
      personalInfo: {},
      education: [],
      experience: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
      },
      projects: [],
      certifications: [],
      summary: '',
      rawText: '',
    };

    try {
      // Try to use AI service for parsing
      if (aiService && typeof aiService.parseResume === 'function') {
        const aiResult = await aiService.parseResume(uploadResult.url);
        extractedData = { ...extractedData, ...aiResult };
      } else {
        // Fallback: Basic parsing based on filename and file type
        extractedData.summary = `Resume uploaded: ${filename}`;
        extractedData.rawText = `Resume file: ${filename} (${uploadResult.format})`;
      }
    } catch (aiError) {
      console.log(
        'AI parsing failed, using basic extraction:',
        aiError.message
      );
      extractedData.summary = `Resume uploaded: ${filename}`;
    }

    return {
      success: true,
      data: {
        ...extractedData,
        fileInfo: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          format: uploadResult.format,
          size: uploadResult.bytes,
          uploadedAt: new Date(),
        },
      },
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Extract skills from resume text
 * @param {string} resumeText - Resume text content
 * @returns {Object} Extracted skills categorized
 */
function extractSkills(resumeText) {
  const skillCategories = {
    technical: [
      'javascript',
      'typescript',
      'python',
      'java',
      'c++',
      'c#',
      'php',
      'ruby',
      'go',
      'rust',
      'react',
      'vue',
      'angular',
      'node.js',
      'express',
      'django',
      'flask',
      'spring',
      'laravel',
      'mongodb',
      'mysql',
      'postgresql',
      'redis',
      'elasticsearch',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'jenkins',
      'git',
      'linux',
      'html',
      'css',
      'sass',
      'bootstrap',
      'tailwind',
      'webpack',
      'babel',
    ],
    soft: [
      'communication',
      'teamwork',
      'leadership',
      'problem solving',
      'critical thinking',
      'time management',
      'adaptability',
      'creativity',
      'analytical thinking',
    ],
    languages: [
      'english',
      'vietnamese',
      'chinese',
      'japanese',
      'korean',
      'french',
      'german',
      'spanish',
    ],
  };

  const found = {
    technical: [],
    soft: [],
    languages: [],
  };

  const text = resumeText.toLowerCase();

  for (const [category, skills] of Object.entries(skillCategories)) {
    skills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        found[category].push(skill);
      }
    });
  }

  return found;
}

/**
 * Extract education information from resume text
 * @param {string} resumeText - Resume text content
 * @returns {Array} Education entries
 */
function extractEducation(resumeText) {
  const educationKeywords = [
    'university',
    'college',
    'institute',
    'school',
    'bachelor',
    'master',
    'phd',
    'degree',
  ];

  const lines = resumeText.split('\n');
  const educationLines = lines.filter(line =>
    educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );

  return educationLines.map(line => ({
    institution: line.trim(),
    degree: 'Not specified',
    field: 'Not specified',
    startDate: null,
    endDate: null,
    gpa: null,
  }));
}

/**
 * Extract experience information from resume text
 * @param {string} resumeText - Resume text content
 * @returns {Array} Experience entries
 */
function extractExperience(resumeText) {
  const experienceKeywords = [
    'intern',
    'developer',
    'engineer',
    'analyst',
    'manager',
    'coordinator',
    'assistant',
  ];

  const lines = resumeText.split('\n');
  const experienceLines = lines.filter(line =>
    experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );

  return experienceLines.map(line => ({
    title: line.trim(),
    company: 'Not specified',
    description: line.trim(),
    startDate: null,
    endDate: null,
    skills: [],
  }));
}

module.exports = {
  parseResume,
  extractSkills,
  extractEducation,
  extractExperience,
};
