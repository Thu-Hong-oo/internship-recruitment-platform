const Skill = require('../models/Skill');
const Industry = require('../models/Industry');
const { logger } = require('./logger');

/**
 * Validate skill name
 * @param {string} skillName - Skill name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidSkillName(skillName) {
  if (!skillName || typeof skillName !== 'string') {
    return false;
  }

  const trimmed = skillName.trim();
  
  // Minimum length: 2 characters
  if (trimmed.length < 2) {
    return false;
  }

  // Maximum length: 100 characters (matching model constraint)
  if (trimmed.length > 100) {
    return false;
  }

  // Blacklist: common invalid patterns
  const blacklist = [
    /^no\s+skill$/i,
    /^test$/i,
    /^none$/i,
    /^n\/a$/i,
    /^na$/i,
    /^null$/i,
    /^undefined$/i,
    /^\s*$/,
    /^[0-9]+$/, // Only numbers
    /^[^a-zA-Z0-9]+$/, // Only special characters
  ];

  for (const pattern of blacklist) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Find or create skills by name
 * Normalizes skill names and checks aliases
 * @param {string[]} skillNames - Array of skill names
 * @returns {Promise<ObjectId[]>} Array of skill IDs
 */
async function findOrCreateSkills(skillNames) {
  if (!Array.isArray(skillNames) || skillNames.length === 0) {
    return [];
  }

  const skillIds = [];
  const normalizedNames = skillNames.map(name => name.trim()).filter(Boolean);

  for (const skillName of normalizedNames) {
    try {
      // Validate skill name before processing
      if (!isValidSkillName(skillName)) {
        logger.warn(`Invalid skill name skipped: "${skillName}"`);
        continue; // Skip invalid skill names
      }

      // Try to find by exact name (case-insensitive)
      let skill = await Skill.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { aliases: { $regex: new RegExp(`^${skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ],
        isActive: true
      });

      // If not found, create a new skill
      if (!skill) {
        // Default category - you might want to make this configurable
        skill = await Skill.create({
          name: skillName,
          category: 'general', // Default category
          isActive: true,
        });
        logger.info(`Created new skill: ${skillName}`);
      }

      // Add skill ID if not already in array
      if (skill && !skillIds.some(id => id.toString() === skill._id.toString())) {
        skillIds.push(skill._id);
      }
    } catch (error) {
      logger.error(`Error processing skill "${skillName}":`, error);
      // Continue with other skills even if one fails
    }
  }

  return skillIds;
}

/**
 * Build industry path from industryCode and subIndustryCode
 * Traverses parent codes to build full path
 * @param {string} industryCode - Root or leaf industry code
 * @param {string} subIndustryCode - Optional sub-industry code
 * @returns {Promise<string[]>} Array of industry codes representing the path
 */
async function buildIndustryPath(industryCode, subIndustryCode = null) {
  const path = [];

  try {
    // If subIndustryCode is provided, use it as the leaf
    let currentCode = subIndustryCode || industryCode;

    if (!currentCode) {
      return path;
    }

    // Traverse up the hierarchy to build the path
    const visited = new Set(); // Prevent infinite loops
    while (currentCode && !visited.has(currentCode)) {
      visited.add(currentCode);
      
      const industry = await Industry.findOne({ code: currentCode }).lean();
      
      if (!industry) {
        logger.warn(`Industry with code "${currentCode}" not found`);
        break;
      }

      // Add to path (at the beginning to maintain hierarchy order)
      path.unshift(currentCode);

      // Move to parent
      currentCode = industry.parentCode;
    }

    // If subIndustryCode was provided, ensure industryCode is in the path
    if (subIndustryCode && industryCode && !path.includes(industryCode)) {
      // Check if industryCode is a parent of subIndustryCode
      const subIndustry = await Industry.findOne({ code: subIndustryCode }).lean();
      if (subIndustry && subIndustry.parentCode === industryCode) {
        path.unshift(industryCode);
      }
    }

    // Ensure industryCode is always first if provided
    if (industryCode && path.length > 0 && path[0] !== industryCode) {
      // Check if industryCode is a valid root
      const rootIndustry = await Industry.findOne({ code: industryCode }).lean();
      if (rootIndustry && !rootIndustry.parentCode) {
        path.unshift(industryCode);
      }
    }
  } catch (error) {
    logger.error('Error building industry path:', error);
  }

  return path;
}

/**
 * Process job data before saving
 * Populates skillIds and industryPath
 * @param {Object} jobData - Job data object
 * @returns {Promise<Object>} Processed job data with skillIds and industryPath
 */
async function processJobData(jobData) {
  const processedData = { ...jobData };

  // Process skills: convert skill names to skillIds
  // Only process if skills array is provided (not empty array means clear skills)
  if (jobData.skills !== undefined) {
    if (Array.isArray(jobData.skills) && jobData.skills.length > 0) {
      processedData.skillIds = await findOrCreateSkills(jobData.skills);
    } else {
      // Empty array means clear skills
      processedData.skillIds = [];
    }
  } else if (jobData.skillIds && Array.isArray(jobData.skillIds)) {
    // If skillIds are already provided, keep them
    processedData.skillIds = jobData.skillIds;
  }

  // Process industry: build industryPath
  // Only rebuild if industryCode or subIndustryCode is being updated
  if (jobData.industryCode !== undefined || jobData.subIndustryCode !== undefined) {
    const industryCode = jobData.industryCode || null;
    const subIndustryCode = jobData.subIndustryCode || null;
    
    if (industryCode || subIndustryCode) {
      processedData.industryPath = await buildIndustryPath(
        industryCode,
        subIndustryCode
      );
    } else {
      // Both are null/undefined, clear the path
      processedData.industryPath = [];
    }
  }

  return processedData;
}

module.exports = {
  findOrCreateSkills,
  buildIndustryPath,
  processJobData,
};

