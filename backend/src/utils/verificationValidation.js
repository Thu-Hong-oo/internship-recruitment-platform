const { logger } = require('./logger');

// Core validation functions for employer verification
const validateBusinessInfo = businessInfo => {
  const errors = [];

  if (
    !businessInfo.registrationNumber ||
    businessInfo.registrationNumber.length < 10
  ) {
    errors.push('Số đăng ký doanh nghiệp không hợp lệ (tối thiểu 10 ký tự)');
  }

  // Validate Vietnamese Tax ID (MST)
  // 10 digits: for companies/individuals (e.g., 0312345678)
  // 13 digits: for branches/subsidiaries (e.g., 0312345678001 or 0312345678-001)
  if (!businessInfo.taxId) {
    errors.push('Mã số thuế không được để trống');
  } else {
    const taxId = businessInfo.taxId.replace(/[-\s]/g, ''); // Remove dashes and spaces
    if (!/^\d{10}$|^\d{13}$/.test(taxId)) {
      errors.push(
        'Mã số thuế không hợp lệ (phải có 10 số cho doanh nghiệp hoặc 13 số cho chi nhánh)'
      );
    }
  }

  if (
    !businessInfo.address ||
    (typeof businessInfo.address === 'object' &&
      (!businessInfo.address.street || !businessInfo.address.city)) ||
    (typeof businessInfo.address === 'string' &&
      businessInfo.address.length < 10)
  ) {
    errors.push(
      'Địa chỉ trụ sở không đầy đủ (cần có đường và thành phố hoặc địa chỉ đầy đủ)'
    );
  }

  return errors;
};

const validateLegalRepresentative = legalRep => {
  const errors = [];

  if (!legalRep.fullName || legalRep.fullName.length < 2) {
    errors.push('Họ tên người đại diện không hợp lệ (tối thiểu 2 ký tự)');
  }

  if (!legalRep.position || legalRep.position.length < 2) {
    errors.push('Chức vụ người đại diện không hợp lệ');
  }

  if (!legalRep.phone || !/^[0-9+\-\s()]{10,15}$/.test(legalRep.phone)) {
    errors.push('Số điện thoại người đại diện không hợp lệ');
  }

  if (legalRep.email && !isValidEmail(legalRep.email)) {
    errors.push('Email người đại diện không hợp lệ');
  }

  // Validate identification if provided (optional)
  if (legalRep.identification) {
    const { type, number } = legalRep.identification;

    // Only validate if type is provided
    if (type && !['CMND', 'CCCD', 'Passport'].includes(type)) {
      errors.push('Loại giấy tờ không hợp lệ');
    }

    // Only validate if number is provided
    if (number && !/^\d{9,12}$/.test(number)) {
      errors.push('Số CMND/CCCD không hợp lệ (9-12 chữ số)');
    }

    // If type is provided, number should also be provided
    if (type && !number) {
      errors.push('Vui lòng nhập số CMND/CCCD khi đã chọn loại giấy tờ');
    }

    // If number is provided, type should also be provided
    if (number && !type) {
      errors.push('Vui lòng chọn loại giấy tờ khi đã nhập số');
    }
  }

  return errors;
};

// Email validation
const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

// Tax ID validation with checksum
const validateTaxId = taxId => {
  if (!taxId || !/^\d{10,13}$/.test(taxId)) {
    return false;
  }

  // Basic checksum validation for Vietnamese tax ID (10 digits)
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

// Cross-check business info with documents
const crossCheckBusinessInfo = (businessInfo, documents) => {
  const warnings = [];

  // Check if registration number is consistent
  if (businessInfo.registrationNumber) {
    const businessLicenseDoc = documents.find(
      doc => doc.documentType === 'business-license'
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
    const taxDoc = documents.find(
      doc => doc.documentType === 'tax-certificate'
    );
    if (taxDoc && taxDoc.metadata?.documentNumber) {
      if (businessInfo.taxId !== taxDoc.metadata.documentNumber) {
        warnings.push('Mã số thuế không khớp với tài liệu đã upload');
      }
    }
  }

  return warnings;
};

// Input sanitization
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
  validateBusinessInfo,
  validateLegalRepresentative,
  isValidEmail,
  isValidCompanyEmail,
  validateTaxId,
  crossCheckBusinessInfo,
  sanitizeInput,
};
