const { logger } = require('./logger');
const {
  getDocumentTypesForIndustry,
  getDocumentTypeById,
} = require('../config/documentTypes');

// Validation functions for employer verification
const validateVerificationData = data => {
  const errors = [];

  // Validate business info
  if (data.businessInfo) {
    const { registrationNumber, taxId, legalAddress } = data.businessInfo;

    if (!registrationNumber || registrationNumber.length < 10) {
      errors.push('Số đăng ký doanh nghiệp không hợp lệ (tối thiểu 10 ký tự)');
    }

    if (!taxId || !/^\d{10,13}$/.test(taxId)) {
      errors.push('Mã số thuế không hợp lệ (10-13 chữ số)');
    }

    if (!legalAddress || !legalAddress.street || !legalAddress.city) {
      errors.push('Địa chỉ trụ sở không đầy đủ (cần có đường và thành phố)');
    }
  }

  // Validate legal representative
  if (data.legalRepresentative) {
    const { fullName, idNumber, idType, email } = data.legalRepresentative;

    if (!fullName || fullName.length < 2) {
      errors.push('Họ tên người đại diện không hợp lệ (tối thiểu 2 ký tự)');
    }

    if (!idNumber || !/^\d{9,12}$/.test(idNumber)) {
      errors.push('Số CMND/CCCD không hợp lệ (9-12 chữ số)');
    }

    if (!idType || !['CMND', 'CCCD', 'Passport'].includes(idType)) {
      errors.push('Loại giấy tờ không hợp lệ');
    }

    if (email && !isValidEmail(email)) {
      errors.push('Email người đại diện không hợp lệ');
    }
  }

  // Validate company email
  if (data.companyEmail) {
    if (!isValidCompanyEmail(data.companyEmail)) {
      errors.push(
        'Email phải là tên miền công ty (không dùng Gmail, Yahoo, Hotmail)'
      );
    }
  }

  // Validate documents
  if (data.documents && data.documents.length > 0) {
    // Get required document types based on industry
    const industry = data.industry || 'general';
    const documentTypes = getDocumentTypesForIndustry(industry);
    const requiredTypes = documentTypes.required.map(type => type.id);
    const uploadedTypes = data.documents.map(doc => doc.type);

    // Check for missing required documents
    for (const requiredType of requiredTypes) {
      if (!uploadedTypes.includes(requiredType)) {
        const docType = getDocumentTypeById(requiredType);
        errors.push(
          `Thiếu tài liệu bắt buộc: ${docType?.name || requiredType}`
        );
      }
    }

    // Validate document metadata
    for (const doc of data.documents) {
      if (doc.metadata) {
        const docErrors = validateDocumentMetadata(
          doc.type,
          doc.metadata,
          industry
        );
        errors.push(...docErrors);
      }
    }

    // Cross-check business info with documents
    if (data.businessInfo) {
      const crossCheckWarnings = crossCheckBusinessInfo(
        data.businessInfo,
        data.documents
      );
      if (crossCheckWarnings.length > 0) {
        errors.push(...crossCheckWarnings);
      }
    }
  }

  return errors;
};

const validateDocumentMetadata = (docType, metadata, industry = 'general') => {
  const errors = [];
  const docTypeConfig = getDocumentTypeById(docType);

  if (!docTypeConfig) {
    errors.push(`Loại tài liệu không hợp lệ: ${docType}`);
    return errors;
  }

  // Validate required metadata fields
  const requiredFields = docTypeConfig.validation?.metadataRequired || [];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      errors.push(
        `Thiếu thông tin bắt buộc: ${field} cho tài liệu ${docTypeConfig.name}`
      );
    }
  }

  // Type-specific validation
  switch (docType) {
    case 'business-license':
      if (metadata.documentNumber && metadata.documentNumber.length < 5) {
        errors.push('Số giấy phép đăng ký kinh doanh không hợp lệ');
      }
      break;

    case 'tax-certificate':
      if (metadata.documentNumber && metadata.documentNumber.length < 5) {
        errors.push('Số giấy chứng nhận đăng ký thuế không hợp lệ');
      }
      break;

    case 'legal-representative-id':
      if (
        metadata.documentNumber &&
        !/^\d{9,12}$/.test(metadata.documentNumber)
      ) {
        errors.push('Số CMND/CCCD không hợp lệ');
      }
      break;

    case 'company-website-screenshot':
      if (metadata.websiteUrl && !isValidUrl(metadata.websiteUrl)) {
        errors.push('URL website không hợp lệ');
      }
      break;

    case 'financial-statement':
      if (
        metadata.reportYear &&
        (metadata.reportYear < 2020 ||
          metadata.reportYear > new Date().getFullYear())
      ) {
        errors.push('Năm báo cáo tài chính không hợp lệ');
      }
      break;
  }

  return errors;
};

const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrl = url => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidCompanyEmail = email => {
  if (!isValidEmail(email)) {
    return false;
  }

  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'aol.com',
    'icloud.com',
  ];

  const domain = email.split('@')[1].toLowerCase();
  return !personalDomains.includes(domain);
};

const getDocumentTypeName = type => {
  const names = {
    'business-license': 'Giấy phép đăng ký kinh doanh',
    'tax-certificate': 'Giấy chứng nhận đăng ký thuế',
    'legal-representative-id': 'CMND/CCCD người đại diện',
    'company-logo': 'Logo công ty',
    'company-website-screenshot': 'Screenshot website công ty',
  };
  return names[type] || type;
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validateTaxId = taxId => {
  if (!taxId || !/^\d{10,13}$/.test(taxId)) {
    return false;
  }

  // Basic checksum validation for Vietnamese tax ID
  if (taxId.length === 10) {
    const weights = [31, 29, 23, 19, 17, 13, 7, 5, 3];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(taxId[i]) * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;

    return checkDigit === parseInt(taxId[9]);
  }

  return true; // For 11-13 digit tax IDs, assume valid
};

const crossCheckBusinessInfo = (businessInfo, documents) => {
  const warnings = [];

  // Check if company name matches across documents
  const businessLicenseDoc = documents.find(
    doc => doc.type === 'business-license'
  );
  if (businessLicenseDoc && businessLicenseDoc.metadata) {
    // This would require OCR text extraction in real implementation
    // For now, just log the check
    logger.info('Cross-checking company name in business license');
  }

  // Check if tax ID matches
  const taxDoc = documents.find(doc => doc.type === 'tax-certificate');
  if (taxDoc && taxDoc.metadata && businessInfo.taxId) {
    // This would require OCR text extraction in real implementation
    logger.info('Cross-checking tax ID in tax certificate');
  }

  // Check if legal address matches
  if (businessInfo.legalAddress) {
    logger.info('Validating legal address consistency');
  }

  // Check if registration number is consistent
  if (businessInfo.registrationNumber) {
    const businessLicenseDoc = documents.find(
      doc => doc.type === 'business-license'
    );
    if (businessLicenseDoc && businessLicenseDoc.metadata?.documentNumber) {
      if (
        businessInfo.registrationNumber !==
        businessLicenseDoc.metadata.documentNumber
      ) {
        warnings.push(
          'Số đăng ký doanh nghiệp không khớp với tài liệu đã upload'
        );
      }
    }
  }

  // Check if tax ID is consistent
  if (businessInfo.taxId) {
    const taxDoc = documents.find(doc => doc.type === 'tax-certificate');
    if (taxDoc && taxDoc.metadata?.documentNumber) {
      if (businessInfo.taxId !== taxDoc.metadata.documentNumber) {
        warnings.push('Mã số thuế không khớp với tài liệu đã upload');
      }
    }
  }

  return warnings;
};

const sanitizeInput = input => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
};

module.exports = {
  validateVerificationData,
  validateDocumentMetadata,
  isValidEmail,
  isValidCompanyEmail,
  getDocumentTypeName,
  generateVerificationCode,
  validateTaxId,
  crossCheckBusinessInfo,
  sanitizeInput,
};
