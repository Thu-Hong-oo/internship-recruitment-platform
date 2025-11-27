const { logger } = require('./logger');

/**
 * Format job address from string format to structured object
 * @param {Object} jobObj - Job object (plain or Mongoose document)
 * @returns {Object} Formatted job object with structured address
 */
function formatJobAddress(jobObj) {
  // Check if address is already a structured object
  if (jobObj.address && typeof jobObj.address === 'object' && (jobObj.address.city || jobObj.address.street)) {
    // Already structured, just ensure it has all fields and fullAddress
    const addr = jobObj.address;
    const addressParts = [
      addr.street,
      addr.ward,
      addr.district,
      addr.city,
      addr.country || 'Vietnam'
    ].filter(Boolean);
    
    return {
      street: addr.street || null,
      ward: addr.ward || null,
      district: addr.district || null,
      city: addr.city || null,
      country: addr.country || 'Vietnam',
      fullAddress: addr.fullAddress || (addressParts.length > 0 ? addressParts.join(', ') : null),
    };
  }

  const addressString = typeof jobObj.address === 'string' ? jobObj.address : '';
  const locationString = typeof jobObj.location === 'string' ? jobObj.location : '';
  
  if (addressString || locationString) {
    // Parse location string to extract city and district
    let city = null;
    let district = null;
    let street = addressString || null;
    
    if (locationString) {
      // List of common Vietnamese cities
      const cityPatterns = [
        { pattern: /Ho Chi Minh|HCM|TP\.?\s*HCM/i, name: 'Ho Chi Minh City' },
        { pattern: /Ha Noi|Hà Nội|HN/i, name: 'Ha Noi City' },
        { pattern: /Da Nang|Đà Nẵng|DN/i, name: 'Da Nang' },
        { pattern: /Hai Phong|Hải Phòng|HP/i, name: 'Hai Phong' },
        { pattern: /Can Tho|Cần Thơ|CT/i, name: 'Can Tho' },
        { pattern: /Hue|Huế|HUE/i, name: 'Hue' },
        { pattern: /Nha Trang|Nha Trang/i, name: 'Nha Trang' },
        { pattern: /Vung Tau|Vũng Tàu|VT/i, name: 'Vung Tau' },
      ];

      // Try to match city patterns first
      let matchedCity = null;
      for (const cityPattern of cityPatterns) {
        if (cityPattern.pattern.test(locationString)) {
          matchedCity = cityPattern.name;
          break;
        }
      }

      if (matchedCity) {
        city = matchedCity;
        // Extract district
        const districtMatch = locationString.match(/District\s*(\d+)|Quận\s*(\d+)|Q\.?\s*(\d+)/i);
        if (districtMatch) {
          district = `District ${districtMatch[1] || districtMatch[2] || districtMatch[3]}`;
        }
        // If location contains full address, extract street
        if (locationString.includes('Street') || locationString.includes('Đường')) {
          const parts = locationString.split(',').map(p => p.trim());
          if (parts.length > 0 && !parts[0].match(/Ho Chi Minh|Ha Noi|Da Nang|Hai Phong/i)) {
            street = parts[0];
          }
        }
      } else {
        // Try to extract city (usually first part before comma)
        const parts = locationString.split(',').map(p => p.trim());
        
        // If it looks like a full address (contains numbers and street-like words), treat first part as street
        if (parts.length > 1 && /^\d+/.test(parts[0])) {
          street = parts[0];
          city = parts[parts.length - 1]; // Last part is usually city
          if (parts.length > 2) {
            district = parts[parts.length - 2];
          }
        } else if (parts.length > 0) {
          // Simple case: just city name
          city = parts[0];
          if (parts.length > 1) {
            district = parts[1];
          }
        }
      }
    }
    
    // Create structured address object
    return {
      street: street,
      ward: null, // Not available from string format
      district: district,
      city: city,
      country: 'Vietnam',
      // Full formatted address
      fullAddress: addressString && locationString 
        ? `${addressString}, ${locationString}` 
        : addressString || locationString || null,
    };
  } else {
    // No address data - provide structured empty object
    return {
      street: null,
      ward: null,
      district: null,
      city: null,
      country: 'Vietnam',
      fullAddress: null,
    };
  }
}

/**
 * Format employer company info
 * @param {Object} employer - Employer object (populated or not)
 * @returns {Object} Formatted employer with company info
 */
function formatEmployerInfo(employer, options = {}) {
  const { mode = 'full' } = options;
  // Handle null or undefined employer
  if (!employer) {
    return null;
  }
  
  // If employer is just an ID string, return as is (should be populated)
  if (typeof employer === 'string') {
    logger.warn('Employer is not populated, returning ID only');
    return { _id: employer };
  }
  
  // If employer was populated but document doesn't exist (deleted), return null
  if (employer._id && !employer.company && !employer.contact) {
    logger.warn(`Employer ${employer._id} not found or deleted`);
    return null;
  }
  
  // If employer is object but missing company, return as is
  if (!employer.company) {
    return employer;
  }
  
  // Minimal payload mode (public job list)
  if (mode === 'minimal') {
    return formatMinimalEmployer(employer);
  }

  // Format officeAddress if it's an object
  if (
    employer.company.officeAddress &&
    typeof employer.company.officeAddress === 'object'
  ) {
    const addr = employer.company.officeAddress;
    employer.company.formattedAddress = [
      addr.street,
      addr.ward,
      addr.district,
      addr.city,
      addr.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  return employer;
}

function formatMinimalEmployer(employer) {
  if (!employer) return null;

  const minimalEmployer = {
    _id: employer._id,
    company: null,
  };

  if (employer.company) {
    const { name = null, logo = null } = employer.company;
    minimalEmployer.company = {
      name: name || null,
      logo: logo
        ? {
            url: logo.url || null,
            cloudinaryId: logo.cloudinaryId || null,
            filename: logo.filename || null,
          }
        : null,
    };
  }

  return minimalEmployer;
}

/**
 * Format a single job object for API response
 * Ensures consistent structure across all endpoints
 * @param {Object} job - Job document (Mongoose or plain object)
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeLocation - Include fullLocation field (default: true)
 * @param {boolean} options.removeLocationField - Remove old location string field (default: true)
 * @returns {Object} Formatted job object
 */
function formatJobResponse(job, options = {}) {
  const {
    includeLocation = true,
    removeLocationField = true,
    employerFields = 'full',
  } = options;
  
  // Convert to plain object if Mongoose document
  const jobObj = job.toObject ? job.toObject() : { ...job };
  
  // Format employer info
  if (jobObj.employer) {
    jobObj.employer = formatEmployerInfo(jobObj.employer, {
      mode: employerFields,
    });
  }
  
  // Format address: Convert string address/location to structured object
  const formattedAddress = formatJobAddress(jobObj);
  jobObj.address = formattedAddress;
  
  // Add fullLocation for backward compatibility
  if (includeLocation) {
    jobObj.fullLocation = formattedAddress.fullAddress;
  }
  
  // Remove old location string field to avoid confusion
  if (removeLocationField && jobObj.location !== undefined) {
    delete jobObj.location;
  }
  
  // Ensure all important fields are present with defaults
  if (!jobObj.stats) {
    jobObj.stats = { applications: 0, interviews: 0, offers: 0 };
  }
  
  // Ensure ai object structure is complete
  if (!jobObj.ai) {
    jobObj.ai = {
      jobCategory: { primary: null, secondary: [], confidence: null },
      keywords: [],
      embedding: [],
      needsReanalysis: false,
      extractedSkills: [],
      matchingPool: [],
      suggestedCandidates: []
    };
  } else {
    // Ensure jobCategory has all required fields
    if (!jobObj.ai.jobCategory) {
      jobObj.ai.jobCategory = { primary: null, secondary: [], confidence: null };
    } else {
      if (jobObj.ai.jobCategory.primary === undefined) {
        jobObj.ai.jobCategory.primary = null;
      }
      if (!Array.isArray(jobObj.ai.jobCategory.secondary)) {
        jobObj.ai.jobCategory.secondary = [];
      }
      if (jobObj.ai.jobCategory.confidence === undefined) {
        jobObj.ai.jobCategory.confidence = null;
      }
    }
  }

  // Normalize salary fields - convert old "salary" string to salaryMin/salaryMax
  if (jobObj.salary && typeof jobObj.salary === 'string' && !jobObj.salaryMin && !jobObj.salaryMax) {
    // Try to parse salary string like "15000000 - 25000000 VND"
    const salaryMatch = jobObj.salary.match(/(\d+)\s*-\s*(\d+)/);
    if (salaryMatch) {
      jobObj.salaryMin = parseInt(salaryMatch[1]);
      jobObj.salaryMax = parseInt(salaryMatch[2]);
    } else {
      // Single number
      const singleMatch = jobObj.salary.match(/(\d+)/);
      if (singleMatch) {
        jobObj.salaryMin = parseInt(singleMatch[1]);
        jobObj.salaryMax = parseInt(singleMatch[1]);
      }
    }
    // Remove old salary field to avoid confusion
    delete jobObj.salary;
  }

  // Ensure skillIds is an array (even if empty)
  if (!Array.isArray(jobObj.skillIds)) {
    jobObj.skillIds = [];
  }

  // Ensure industryPath is an array (even if empty)
  if (!Array.isArray(jobObj.industryPath)) {
    jobObj.industryPath = [];
  }

  // Remove unnecessary fields
  // Remove Mongoose version key
  if (jobObj.__v !== undefined) {
    delete jobObj.__v;
  }

  // Remove deletedAt and deletedBy if job is not deleted
  if (!jobObj.deletedAt) {
    delete jobObj.deletedAt;
    delete jobObj.deletedBy;
  }

  // Remove duplicate fields in postedBy
  if (jobObj.postedBy) {
    // Remove id if it's the same as _id
    if (jobObj.postedBy.id && jobObj.postedBy._id && jobObj.postedBy.id === jobObj.postedBy._id.toString()) {
      delete jobObj.postedBy.id;
    }
    // Remove displayFullName if it's the same as fullName
    if (jobObj.postedBy.displayFullName && jobObj.postedBy.fullName && 
        jobObj.postedBy.displayFullName === jobObj.postedBy.fullName) {
      delete jobObj.postedBy.displayFullName;
    }
  }

  // Remove duplicate fields in employer
  if (jobObj.employer && jobObj.employer.id && jobObj.employer._id && 
      jobObj.employer.id === jobObj.employer._id.toString()) {
    delete jobObj.employer.id;
  }

  // Remove fullLocation if it's the same as address.fullAddress (redundant)
  // But keep it if they're different (backward compatibility)
  if (jobObj.fullLocation && jobObj.address && jobObj.address.fullAddress) {
    if (jobObj.fullLocation === jobObj.address.fullAddress) {
      delete jobObj.fullLocation;
    }
  } else if (jobObj.fullLocation && (!jobObj.address || !jobObj.address.fullAddress)) {
    // Keep fullLocation if address.fullAddress doesn't exist
    // This maintains backward compatibility
  }

  // Remove empty arrays to reduce payload size
  if (Array.isArray(jobObj.tags) && jobObj.tags.length === 0) {
    delete jobObj.tags;
  }
  if (Array.isArray(jobObj.aiTags) && jobObj.aiTags.length === 0) {
    delete jobObj.aiTags;
  }
  if (Array.isArray(jobObj.skillIds) && jobObj.skillIds.length === 0) {
    delete jobObj.skillIds;
  }
  if (Array.isArray(jobObj.industryPath) && jobObj.industryPath.length === 0) {
    delete jobObj.industryPath;
  }

  // Clean up AI object - remove empty arrays
  if (jobObj.ai) {
    if (Array.isArray(jobObj.ai.keywords) && jobObj.ai.keywords.length === 0) {
      delete jobObj.ai.keywords;
    }
    if (Array.isArray(jobObj.ai.embedding) && jobObj.ai.embedding.length === 0) {
      delete jobObj.ai.embedding;
    }
    if (Array.isArray(jobObj.ai.suggestedCandidates) && jobObj.ai.suggestedCandidates.length === 0) {
      delete jobObj.ai.suggestedCandidates;
    }
    if (Array.isArray(jobObj.ai.matchingPool) && jobObj.ai.matchingPool.length === 0) {
      delete jobObj.ai.matchingPool;
    }
    if (Array.isArray(jobObj.ai.extractedSkills) && jobObj.ai.extractedSkills.length === 0) {
      delete jobObj.ai.extractedSkills;
    }
    
    // Clean up jobCategory
    if (jobObj.ai.jobCategory) {
      if (Array.isArray(jobObj.ai.jobCategory.secondary) && jobObj.ai.jobCategory.secondary.length === 0) {
        delete jobObj.ai.jobCategory.secondary;
      }
      // Remove jobCategory if all fields are empty/null
      if (!jobObj.ai.jobCategory.primary && 
          (!jobObj.ai.jobCategory.secondary || jobObj.ai.jobCategory.secondary.length === 0) &&
          jobObj.ai.jobCategory.confidence === null) {
        delete jobObj.ai.jobCategory;
      }
    }
    
    // Remove ai object if it's completely empty
    // Check if there's any meaningful data left
    const hasMeaningfulData = Object.keys(jobObj.ai).some(key => {
      const value = jobObj.ai[key];
      // needsReanalysis = false is not meaningful, skip it
      if (key === 'needsReanalysis' && value === false) {
        return false;
      }
      // Check if value has meaningful content
      if (value === null || value === undefined) return false;
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === 'object' && Object.keys(value).length > 0) return true;
      if (typeof value === 'boolean' && value === true) return true;
      if (typeof value === 'string' && value.length > 0) return true;
      if (typeof value === 'number') return true;
      return false;
    });
    
    // Remove ai object if no meaningful data
    if (!hasMeaningfulData) {
      delete jobObj.ai;
    } else if (jobObj.ai.needsReanalysis === false && Object.keys(jobObj.ai).length === 1) {
      // If only needsReanalysis = false remains, remove it
      delete jobObj.ai.needsReanalysis;
      if (Object.keys(jobObj.ai).length === 0) {
        delete jobObj.ai;
      }
    }
  }
  
  return jobObj;
}

function formatMinimalJobResponse(job) {
  if (!job) {
    return null;
  }

  const jobObj = job.toObject ? job.toObject() : { ...job };

  const minimalJob = {
    _id: jobObj._id,
    title: jobObj.title,
    slug: jobObj.slug,
    description: jobObj.description,
    requirements: jobObj.requirements,
    benefits: jobObj.benefits,
    skills: jobObj.skills || [],
    tags: jobObj.tags || [],
    jobType: jobObj.jobType || null,
    workingMode: jobObj.workingMode || null,
    level: jobObj.level || null,
    salaryMin: jobObj.salaryMin || null,
    salaryMax: jobObj.salaryMax || null,
    currency: jobObj.currency || 'VND',
    experience: jobObj.experience || null,
    deadline: jobObj.deadline || null,
    positions: jobObj.positions || null,
    status: jobObj.status || null,
    stats: jobObj.stats || { applications: 0, interviews: 0, offers: 0 },
    createdAt: jobObj.createdAt,
    updatedAt: jobObj.updatedAt,
    address: formatJobAddress(jobObj),
    industryCode: jobObj.industryCode || null,
    subIndustryCode: jobObj.subIndustryCode || null,
  };

  minimalJob.employer = formatMinimalEmployer(jobObj.employer);

  return minimalJob;
}

function formatMinimalJobsResponse(jobs) {
  if (!Array.isArray(jobs)) {
    return [];
  }

  return jobs.map(job => formatMinimalJobResponse(job));
}

/**
 * Format multiple jobs for API response
 * @param {Array} jobs - Array of job documents
 * @param {Object} options - Formatting options (same as formatJobResponse)
 * @returns {Array} Array of formatted job objects
 */
function formatJobsResponse(jobs, options = {}) {
  if (!Array.isArray(jobs)) {
    return [];
  }
  
  return jobs.map(job => formatJobResponse(job, options));
}

module.exports = {
  formatJobResponse,
  formatJobsResponse,
  formatJobAddress,
  formatEmployerInfo,
  formatMinimalJobResponse,
  formatMinimalJobsResponse,
};

