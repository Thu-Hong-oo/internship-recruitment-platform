module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Common validation messages
  VALIDATION: {
    REQUIRED: 'Trường này là bắt buộc',
    INVALID_FORMAT: 'Định dạng không hợp lệ',
    TOO_SHORT: 'Quá ngắn',
    TOO_LONG: 'Quá dài',
    INVALID_EMAIL: 'Định dạng email không hợp lệ',
    INVALID_PHONE: 'Định dạng số điện thoại không hợp lệ',
    INVALID_URL: 'Định dạng URL không hợp lệ',
    INVALID_DATE: 'Định dạng ngày tháng không hợp lệ',
    MIN_LENGTH: min => `Tối thiểu ${min} ký tự`,
    MAX_LENGTH: max => `Tối đa ${max} ký tự`,
    MIN_VALUE: min => `Giá trị tối thiểu là ${min}`,
    MAX_VALUE: max => `Giá trị tối đa là ${max}`,
  },

  // Common error messages
  ERRORS: {
    // General
    INTERNAL_SERVER_ERROR: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    BAD_REQUEST: 'Yêu cầu không hợp lệ',
    UNAUTHORIZED: 'Không có quyền truy cập',
    FORBIDDEN: 'Bị cấm truy cập',
    NOT_FOUND: 'Không tìm thấy',
    CONFLICT: 'Xung đột dữ liệu',
    TOO_MANY_REQUESTS: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',

    // Database
    DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
    DUPLICATE_ENTRY: 'Dữ liệu đã tồn tại',
    RECORD_NOT_FOUND: 'Không tìm thấy bản ghi',

    // File upload
    FILE_TOO_LARGE: 'File quá lớn',
    INVALID_FILE_TYPE: 'Loại file không được hỗ trợ',
    UPLOAD_FAILED: 'Tải file lên thất bại',

    // Network
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    TIMEOUT: 'Hết thời gian chờ',
    SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời không khả dụng',
  },

  // Common success messages
  SUCCESS: {
    CREATED: 'Tạo thành công',
    UPDATED: 'Cập nhật thành công',
    DELETED: 'Xóa thành công',
    SAVED: 'Lưu thành công',
    SENT: 'Gửi thành công',
    UPLOADED: 'Tải lên thành công',
    PROCESSED: 'Xử lý thành công',
  },

  // File upload constants
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    UPLOAD_PATH: 'uploads/',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Date formats
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    DATETIME: 'DD/MM/YYYY HH:mm:ss',
    TIME: 'HH:mm:ss',
  },

  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    EMPLOYER: 'employer',
    CANDIDATE: 'candidate',
    RECRUITER: 'recruiter',
    HR_MANAGER: 'hr_manager',
    MODERATOR: 'moderator',
  },

  // User status
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
    PENDING: 'pending',
  },

  // Status labels for display
  USER_STATUS_LABELS: {
    active: 'Đang hoạt động',
    inactive: 'Không hoạt động',
    suspended: 'Tạm khóa',
    banned: 'Bị cấm',
    pending: 'Chờ duyệt',
  },

  // Skill levels
  SKILL_LEVELS: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },

  // Internship types
  INTERNSHIP_TYPES: {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    REMOTE: 'remote',
    HYBRID: 'hybrid',
  },


  // Job status
  JOB_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    PAUSED: 'paused',
    CLOSED: 'closed',
    FILLED: 'filled',
    REJECTED: 'rejected',
  },

  // Posted by types
  POSTED_BY_TYPES: {
    USER: 'User',
    EMPLOYER_PROFILE: 'EmployerProfile',
    ADMIN: 'Admin',
  },

  // Job types
  JOB_TYPES: {
    INTERNSHIP: 'internship',
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    CONTRACT: 'contract',
    FREELANCE: 'freelance',
  },

  // Job categories
  JOB_CATEGORIES: {
    TECHNOLOGY: 'technology',
    DESIGN: 'design',
    DATA_SCIENCE: 'data-science',
    MOBILE_DEVELOPMENT: 'mobile-development',
    WEB_DEVELOPMENT: 'web-development',
    MARKETING: 'marketing',
    SALES: 'sales',
    BUSINESS_DEVELOPMENT: 'business-development',
    FINANCE: 'finance',
    ACCOUNTING: 'accounting',
    HUMAN_RESOURCES: 'human-resources',
    CONTENT_WRITING: 'content-writing',
    CUSTOMER_SERVICE: 'customer-service',
    OPERATIONS: 'operations',
    RESEARCH: 'research',
    EDUCATION: 'education',
    HEALTHCARE: 'healthcare',
    ENGINEERING: 'engineering',
    LEGAL: 'legal',
    OTHER: 'other',
  },

  // Location types
  LOCATION_TYPES: {
    ONSITE: 'onsite',
    REMOTE: 'remote',
    HYBRID: 'hybrid',
  },

  // Work schedules
  WORK_SCHEDULES: {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    FLEXIBLE: 'flexible',
  },

  // Duration units
  DURATION_UNITS: {
    WEEKS: 'weeks',
    MONTHS: 'months',
    YEARS: 'years',
  },

  // Currency types
  CURRENCY_TYPES: {
    VND: 'VND',
    USD: 'USD',
    EUR: 'EUR',
  },

  // Salary periods
  SALARY_PERIODS: {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
    PROJECT: 'project',
  },

  // Application methods
  APPLICATION_METHODS: {
    PLATFORM: 'platform',
    EMAIL: 'email',
    WEBSITE: 'website',
    PHONE: 'phone',
  },

  // Education levels
  EDUCATION_LEVELS: {
    HIGH_SCHOOL: 'high-school',
    VOCATIONAL: 'vocational',
    COLLEGE: 'college',
    UNIVERSITY: 'university',
    MASTERS: 'masters',
    PHD: 'phd',
    ANY: 'any',
  },

  // Team roles
  TEAM_ROLES: {
    RECRUITER: 'recruiter',
    HR: 'hr',
    MANAGER: 'manager',
  },

  // Application status
  APPLICATION_STATUS: {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    SHORTLISTED: 'shortlisted',
    INTERVIEW: 'interview',
    OFFER: 'offer',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
  },

  // Employer profile status
  EMPLOYER_PROFILE_STATUS: {
    DRAFT: 'draft',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  },

  // Roadmap status
  ROADMAP_STATUS: {
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PAUSED: 'paused',
  },

  // Notification types (recruitment)
  NOTIFICATION_TYPES: {
    NEW_APPLICATION: 'NEW_APPLICATION',
    INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
    APPLICATION_STATUS: 'APPLICATION_STATUS',
    NEW_MESSAGE: 'NEW_MESSAGE',
    SKILL_RECOMMENDATION: 'SKILL_RECOMMENDATION',
    JOB_MATCH: 'JOB_MATCH',
    SYSTEM: 'SYSTEM',
  },

  // Notification priorities
  NOTIFICATION_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  // Notification channels
  NOTIFICATION_CHANNELS: {
    IN_APP: 'in_app',
    EMAIL: 'email',
    PUSH: 'push',
  },
};
