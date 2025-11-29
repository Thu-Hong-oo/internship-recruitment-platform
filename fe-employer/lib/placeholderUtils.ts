/**
 * Utility functions to detect placeholder/mock data from API
 */

/**
 * Check if email is a placeholder email
 */
export function isPlaceholderEmail(email?: string): boolean {
  if (!email) return false;
  return (
    email.includes("@placeholder.company") ||
    email.includes("temp-") ||
    email.includes("placeholder")
  );
}

/**
 * Check if value is a placeholder text
 */
export function isPlaceholderText(value?: string): boolean {
  if (!value) return false;
  const placeholderTexts = [
    "Chưa cập nhật",
    "Tên công ty",
    "Người đại diện",
    "Người liên hệ",
    "Giám đốc",
  ];
  return placeholderTexts.some((text) => value === text);
}

/**
 * Check if phone is a placeholder phone
 */
export function isPlaceholderPhone(phone?: string): boolean {
  if (!phone) return false;
  return phone === "0123456789" || phone.startsWith("999999");
}

/**
 * Check if registration number is a placeholder
 */
export function isPlaceholderRegistrationNumber(regNumber?: string): boolean {
  if (!regNumber) return false;
  return regNumber.startsWith("REG") || regNumber.startsWith("999999");
}

/**
 * Check if tax ID is a placeholder
 */
export function isPlaceholderTaxId(taxId?: string): boolean {
  if (!taxId) return false;
  return taxId.startsWith("999999");
}

/**
 * Check if company data contains placeholder values
 */
export function isPlaceholderCompanyData(data: any): boolean {
  if (!data) return false;

  // Check company name
  if (isPlaceholderText(data.name)) return true;

  // Check email
  if (isPlaceholderEmail(data.email)) return true;

  // Check business info
  if (data.businessInfo) {
    if (
      isPlaceholderRegistrationNumber(data.businessInfo.registrationNumber)
    )
      return true;
    if (isPlaceholderTaxId(data.businessInfo.taxId)) return true;
    if (isPlaceholderText(data.businessInfo.issuePlace)) return true;

    // Check address
    if (data.businessInfo.address) {
      const addr = data.businessInfo.address;
      if (
        isPlaceholderText(addr.street) ||
        isPlaceholderText(addr.ward) ||
        isPlaceholderText(addr.district) ||
        isPlaceholderText(addr.city)
      )
        return true;
    }
  }

  // Check legal representative
  if (data.legalRepresentative) {
    if (isPlaceholderText(data.legalRepresentative.fullName)) return true;
    if (isPlaceholderEmail(data.legalRepresentative.email)) return true;
    if (isPlaceholderPhone(data.legalRepresentative.phone)) return true;
  }

  return false;
}

/**
 * Check if profile contact data contains placeholder values
 */
export function isPlaceholderProfileData(data: any): boolean {
  if (!data) return false;

  // Check contact
  if (data.contact) {
    if (isPlaceholderText(data.contact.name)) return true;
    if (isPlaceholderEmail(data.contact.email)) return true;
    if (isPlaceholderPhone(data.contact.phone)) return true;
  }

  // Check position
  if (data.position) {
    // Empty position fields are also considered placeholder
    if (
      !data.position.title &&
      !data.position.level &&
      !data.position.department
    )
      return true;
  }

  return false;
}

/**
 * Get placeholder indicator message
 */
export function getPlaceholderMessage(field: string): string {
  return `Dữ liệu mẫu - Vui lòng cập nhật ${field}`;
}

