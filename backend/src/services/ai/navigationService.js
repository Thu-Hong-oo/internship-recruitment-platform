/**
 * 🧭 Navigation Service
 * 
 * Maps intent + parameters → route + query string
 * Tương thích với Next.js App Router
 */

class NavigationService {
  constructor() {
    // Intent to route mapping cho Candidate (fe)
    this.candidateRoutes = {
      'navigate.home': { route: '/home', params: {} },
      'navigate.dashboard': { route: '/', params: {} },
      'cv.create': { route: '/my-cv/templates', params: {} },
      'cv.view': { route: '/my-cv', params: {} },
      'job.search': { route: '/search', params: {} },
      'job.search.location': { route: '/search', params: {} },
      'job.detail': { route: '/jobs', params: {} }, // Will need jobId
      'profile.view': { route: '/profile', params: {} },
      'profile.edit': { route: '/profile', params: {} },
      'applied-jobs.view': { route: '/applied-jobs', params: {} },
      'saved-jobs.view': { route: '/jobs/saved-jobs', params: {} },
      'skill-gap.analyze': { route: '/skill-gap-analysis', params: {} },
      'roadmap.view': { route: '/roadmaps', params: {} },
      'notifications.view': { route: '/notifications', params: {} }
    };
    
    // Intent to route mapping cho Employer (fe-employer)
    this.employerRoutes = {
      'navigate.home': { route: '/', params: {} },
      'navigate.dashboard': { route: '/dashboard', params: {} },
      'job.create': { route: '/jobs/create-job', params: {} },
      'job.view': { route: '/jobs', params: {} },
      'job.edit': { route: '/jobs', params: {} }, // Will need jobId
      'applications.view': { route: '/applications', params: {} },
      'profile.view': { route: '/profile', params: {} },
      'company.view': { route: '/company', params: {} },
      'analytics.view': { route: '/analytics', params: {} },
      'team.view': { route: '/team', params: {} },
      'notifications.view': { route: '/notifications', params: {} }
    };
  }
  
  /**
   * Build navigation URL từ intent + parameters
   * @param {string} intent - Intent name
   * @param {Object} parameters - Parameters từ intent recognition
   * @param {string} frontend - 'fe' hoặc 'fe-employer'
   * @returns {Object} Navigation result với route và URL
   */
  buildNavigationUrl(intent, parameters = {}, frontend = 'fe') {
    const routeMap = frontend === 'fe-employer' ? this.employerRoutes : this.candidateRoutes;
    const routeConfig = routeMap[intent];
    
    if (!routeConfig) {
      // Fallback: search với query string
      return {
        route: '/search',
        url: `/search?q=${encodeURIComponent(JSON.stringify(parameters))}`,
        params: parameters,
        error: `Unknown intent: ${intent}`
      };
    }
    
    const route = routeConfig.route;
    const queryParams = new URLSearchParams();
    
    // Merge default params với user params
    const finalParams = { ...routeConfig.params, ...parameters };
    
    // Special handling cho các intent cụ thể
    if (intent === 'job.search' || intent === 'job.search.location') {
      // Map parameters to search query - tương thích với JobFilters format
      
      // Location: JobFilters sử dụng 'location' (string) với tên thành phố đầy đủ
      if (finalParams.city || finalParams.location) {
        const cityName = finalParams.city || finalParams.location;
        // Map normalized city name to full city name (nếu cần)
        const mappedLocation = this._mapCityToLocationName(cityName);
        queryParams.set('location', mappedLocation);
      }
      
      // Search query/keyword - ưu tiên keyword, sau đó job_title, cuối cùng q
      const searchQuery = finalParams.keyword || finalParams.job_title || finalParams.q;
      if (searchQuery && String(searchQuery).trim().length > 0) {
        queryParams.set('q', String(searchQuery).trim());
      }
      
      // Skills
      if (finalParams.skills) {
        const skills = Array.isArray(finalParams.skills) 
          ? finalParams.skills 
          : [finalParams.skills];
        queryParams.set('skills', skills.join(','));
      }
      
      // Salary
      if (finalParams.salary || finalParams.salary_min) {
        const salaryValue = finalParams.salary || finalParams.salary_min;
        // Ensure it's a number
        const salaryNum = typeof salaryValue === 'number' ? salaryValue : parseInt(salaryValue);
        if (!isNaN(salaryNum)) {
          queryParams.set('salaryMin', String(salaryNum));
        }
      }
      if (finalParams.salary_max) {
        const salaryNum = typeof finalParams.salary_max === 'number' 
          ? finalParams.salary_max 
          : parseInt(finalParams.salary_max);
        if (!isNaN(salaryNum)) {
          queryParams.set('salaryMax', String(salaryNum));
        }
      }
      
      // Job level
      if (finalParams.level) {
        queryParams.set('level', finalParams.level);
      }
      
      // Working mode
      if (finalParams.workingMode || finalParams.working_mode) {
        queryParams.set('workingMode', finalParams.workingMode || finalParams.working_mode);
      }
      
      // Job type
      if (finalParams.jobType || finalParams.job_type) {
        queryParams.set('jobType', finalParams.jobType || finalParams.job_type);
      }
      
      // Industry
      if (finalParams.industryCode || finalParams.industry_code) {
        queryParams.set('industryCode', finalParams.industryCode || finalParams.industry_code);
      }
      
      if (finalParams.subIndustryCode || finalParams.sub_industry_code) {
        queryParams.set('subIndustryCode', finalParams.subIndustryCode || finalParams.sub_industry_code);
      }
    } else if (intent === 'job.detail' && finalParams.job_id) {
      // Job detail page với ID
      return {
        route: `/jobs/${finalParams.job_id}`,
        url: `/jobs/${finalParams.job_id}`,
        params: finalParams
      };
    } else if (intent === 'skill-gap.analyze' && finalParams.job_id) {
      // Skill gap analysis với job ID
      queryParams.set('jobId', finalParams.job_id);
    } else {
      // Generic parameter mapping
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(','));
          } else {
            queryParams.set(key, String(value));
          }
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `${route}?${queryString}` : route;
    
    return {
      route,
      url,
      params: finalParams
    };
  }
  
  /**
   * Map normalized city name to location name format used by JobFilters
   * JobFilters expects full city names like "Thành phố Hồ Chí Minh", "Thành phố Hà Nội"
   * Format từ provinces.open-api.vn API
   * @param {string} cityName - Normalized city name (e.g., "Ho Chi Minh", "Sài Gòn")
   * @returns {string} Location name for JobFilters
   */
  _mapCityToLocationName(cityName) {
    if (!cityName) return cityName;
    
    const normalized = cityName.trim();
    
    // Map normalized names to full location names (format từ provinces.open-api.vn)
    // Bao gồm cả các tên phổ biến như "Sài Gòn", "TP.HCM", etc.
    const cityToLocationMap = {
      // Ho Chi Minh variations
      'ho chi minh': 'Thành phố Hồ Chí Minh',
      'sài gòn': 'Thành phố Hồ Chí Minh',
      'sai gon': 'Thành phố Hồ Chí Minh',
      'sg': 'Thành phố Hồ Chí Minh',
      'tphcm': 'Thành phố Hồ Chí Minh',
      'tp hcm': 'Thành phố Hồ Chí Minh',
      'tp. hcm': 'Thành phố Hồ Chí Minh',
      'thành phố hồ chí minh': 'Thành phố Hồ Chí Minh',
      
      // Ha Noi variations
      'ha noi': 'Thành phố Hà Nội',
      'hà nội': 'Thành phố Hà Nội',
      'hn': 'Thành phố Hà Nội',
      'thành phố hà nội': 'Thành phố Hà Nội',
      
      // Da Nang variations
      'da nang': 'Thành phố Đà Nẵng',
      'đà nẵng': 'Thành phố Đà Nẵng',
      'thành phố đà nẵng': 'Thành phố Đà Nẵng',
      
      // Can Tho variations
      'can tho': 'Thành phố Cần Thơ',
      'cần thơ': 'Thành phố Cần Thơ',
      'thành phố cần thơ': 'Thành phố Cần Thơ',
      
      // Hai Phong variations
      'hai phong': 'Thành phố Hải Phòng',
      'hải phòng': 'Thành phố Hải Phòng',
      'thành phố hải phòng': 'Thành phố Hải Phòng',
    };
    
    // Check case-insensitive match
    const lowerNormalized = normalized.toLowerCase();
    if (cityToLocationMap[lowerNormalized]) {
      return cityToLocationMap[lowerNormalized];
    }
    
    // Check partial match (e.g., "Hồ Chí Minh" contains "ho chi minh")
    for (const [key, value] of Object.entries(cityToLocationMap)) {
      if (lowerNormalized.includes(key) || key.includes(lowerNormalized)) {
        return value;
      }
    }
    
    // Return as-is if no mapping found (có thể đã đúng format hoặc là tên tỉnh khác)
    return normalized;
  }
  
  /**
   * Get available intents cho frontend
   * @param {string} frontend - 'fe' hoặc 'fe-employer'
   * @returns {Object} Available intents
   */
  getAvailableIntents(frontend = 'fe') {
    return frontend === 'fe-employer' ? this.employerRoutes : this.candidateRoutes;
  }
}

module.exports = new NavigationService();


