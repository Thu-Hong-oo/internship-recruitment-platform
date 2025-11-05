// Document types configuration
const DOCUMENT_TYPES = {
  // Required documents for all companies
  REQUIRED: [
    {
      id: 'business-license',
      name: 'Giấy phép đăng ký kinh doanh',
      nameEn: 'Business Registration Certificate',
      required: true,
      description: 'Giấy phép đăng ký kinh doanh do cơ quan có thẩm quyền cấp',
      validation: {
        metadataRequired: ['documentNumber', 'issueDate', 'issuePlace'],
        fileTypes: ['pdf', 'jpg', 'png'],
        maxSize: '10MB',
      },
    },
    {
      id: 'tax-certificate',
      name: 'Giấy chứng nhận đăng ký thuế',
      nameEn: 'Tax Registration Certificate',
      required: true,
      description: 'Giấy chứng nhận đăng ký thuế do cơ quan thuế cấp',
      validation: {
        metadataRequired: ['documentNumber', 'issueDate'],
        fileTypes: ['pdf', 'jpg', 'png'],
        maxSize: '10MB',
      },
    },
  ],

  // Optional documents
  OPTIONAL: [
    {
      id: 'legal-representative-id',
      name: 'CMND/CCCD người đại diện',
      nameEn: 'Legal Representative ID',
      required: false,
      description:
        'CMND/CCCD/Hộ chiếu của người đại diện pháp luật (tùy chọn - chỉ cần khi xác minh nâng cao)',
      validation: {
        metadataRequired: ['documentNumber', 'issueDate', 'issuePlace'],
        fileTypes: ['pdf', 'jpg', 'png'],
        maxSize: '5MB',
      },
    },
    {
      id: 'business-plan',
      name: 'Kế hoạch kinh doanh',
      nameEn: 'Business Plan',
      required: false,
      description: 'Kế hoạch kinh doanh của công ty (nếu có)',
      validation: {
        metadataRequired: [],
        fileTypes: ['pdf', 'doc', 'docx'],
        maxSize: '20MB',
      },
    },
    {
      id: 'financial-statement',
      name: 'Báo cáo tài chính',
      nameEn: 'Financial Statement',
      required: false,
      description: 'Báo cáo tài chính gần nhất (nếu có)',
      validation: {
        metadataRequired: ['reportYear', 'reportPeriod'],
        fileTypes: ['pdf', 'xlsx', 'xls'],
        maxSize: '20MB',
      },
    },
  ],

  // Industry-specific documents
  INDUSTRY_SPECIFIC: {
    healthcare: [
      {
        id: 'medical-license',
        name: 'Giấy phép hoạt động y tế',
        nameEn: 'Medical Practice License',
        required: true,
        description: 'Giấy phép hoạt động trong lĩnh vực y tế',
      },
    ],
    education: [
      {
        id: 'education-license',
        name: 'Giấy phép hoạt động giáo dục',
        nameEn: 'Education License',
        required: true,
        description: 'Giấy phép hoạt động trong lĩnh vực giáo dục',
      },
    ],
    finance: [
      {
        id: 'financial-license',
        name: 'Giấy phép hoạt động tài chính',
        nameEn: 'Financial Services License',
        required: true,
        description: 'Giấy phép hoạt động trong lĩnh vực tài chính',
      },
    ],
  },
};

// Get all document types for a specific industry
const getDocumentTypesForIndustry = industry => {
  const required = DOCUMENT_TYPES.REQUIRED;
  const optional = DOCUMENT_TYPES.OPTIONAL;
  const industrySpecific = DOCUMENT_TYPES.INDUSTRY_SPECIFIC[industry] || [];

  return {
    required: [...required, ...industrySpecific.filter(doc => doc.required)],
    optional: [...optional, ...industrySpecific.filter(doc => !doc.required)],
  };
};

// Get document type by ID
const getDocumentTypeById = id => {
  const allTypes = [
    ...DOCUMENT_TYPES.REQUIRED,
    ...DOCUMENT_TYPES.OPTIONAL,
    ...Object.values(DOCUMENT_TYPES.INDUSTRY_SPECIFIC).flat(),
  ];

  return allTypes.find(type => type.id === id);
};

// Validate document type
const validateDocumentType = (typeId, industry) => {
  const documentTypes = getDocumentTypesForIndustry(industry);
  const allTypes = [...documentTypes.required, ...documentTypes.optional];

  return allTypes.some(type => type.id === typeId);
};

// Validate document metadata
const validateDocumentMetadata = (documentType, metadata) => {
  const docType = getDocumentTypeById(documentType);
  if (!docType) return { valid: false, error: 'Document type not found' };

  const requiredFields = docType.validation.metadataRequired || [];
  const missingFields = requiredFields.filter(field => !metadata[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required metadata: ${missingFields.join(', ')}`,
      missingFields,
    };
  }

  return { valid: true };
};

// Check if all required documents are uploaded
const checkRequiredDocuments = (uploadedDocuments, industry) => {
  const documentTypes = getDocumentTypesForIndustry(industry);
  const requiredTypes = documentTypes.required.map(doc => doc.id);
  const uploadedTypes = uploadedDocuments.map(doc => doc.documentType || doc);

  const missingRequired = requiredTypes.filter(
    type => !uploadedTypes.includes(type)
  );

  return {
    allRequiredUploaded: missingRequired.length === 0,
    missingRequired,
    requiredCount: requiredTypes.length,
    uploadedCount: uploadedTypes.length,
  };
};

// Get document validation rules
const getDocumentValidationRules = documentType => {
  const docType = getDocumentTypeById(documentType);
  if (!docType) return null;

  return {
    fileTypes: docType.validation.fileTypes,
    maxSize: docType.validation.maxSize,
    metadataRequired: docType.validation.metadataRequired || [],
  };
};

// Get verification progress
const getVerificationProgress = (uploadedDocuments, industry) => {
  const check = checkRequiredDocuments(uploadedDocuments, industry);
  const documentTypes = getDocumentTypesForIndustry(industry);
  const totalRequired = documentTypes.required.length;
  const uploadedRequired = totalRequired - check.missingRequired.length;

  return {
    percentage: Math.round((uploadedRequired / totalRequired) * 100),
    uploadedRequired,
    totalRequired,
    missingRequired: check.missingRequired,
  };
};

module.exports = {
  DOCUMENT_TYPES,
  getDocumentTypesForIndustry,
  getDocumentTypeById,
  validateDocumentType,
  validateDocumentMetadata,
  checkRequiredDocuments,
  getDocumentValidationRules,
  getVerificationProgress,
};
