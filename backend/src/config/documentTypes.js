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
    {
      id: 'legal-representative-id',
      name: 'CMND/CCCD người đại diện',
      nameEn: 'Legal Representative ID',
      required: true,
      description: 'CMND/CCCD/Hộ chiếu của người đại diện pháp luật',
      validation: {
        metadataRequired: ['documentNumber', 'issueDate', 'issuePlace'],
        fileTypes: ['pdf', 'jpg', 'png'],
        maxSize: '5MB',
      },
    },
  ],

  // Optional documents
  OPTIONAL: [
    {
      id: 'company-logo',
      name: 'Logo công ty',
      nameEn: 'Company Logo',
      required: false,
      description: 'Logo chính thức của công ty',
      validation: {
        metadataRequired: [],
        fileTypes: ['jpg', 'png', 'svg'],
        maxSize: '2MB',
      },
    },
    {
      id: 'company-website-screenshot',
      name: 'Screenshot website công ty',
      nameEn: 'Company Website Screenshot',
      required: false,
      description: 'Screenshot trang chủ website chính thức của công ty',
      validation: {
        metadataRequired: ['websiteUrl'],
        fileTypes: ['jpg', 'png'],
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

module.exports = {
  DOCUMENT_TYPES,
  getDocumentTypesForIndustry,
  getDocumentTypeById,
  validateDocumentType,
};
