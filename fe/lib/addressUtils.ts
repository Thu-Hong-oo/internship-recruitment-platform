export interface AddressData {
  street?: string;
  ward?: string;
  wardName?: string;
  district?: string;
  districtName?: string;
  city?: string;
  cityName?: string;
  country: string;
}

export interface AddressValidation {
  isValid: boolean;
  errors: string[];
}

export const validateAddress = (address: AddressData): AddressValidation => {
  const errors: string[] = [];

  // Không bắt buộc nhập địa chỉ, nhưng nếu nhập thì phải đúng thứ tự
  if (address.city && !address.district) {
    errors.push("Vui lòng chọn quận/huyện sau khi chọn tỉnh/thành phố");
  }

  if (address.district && !address.ward) {
    errors.push("Vui lòng chọn phường/xã sau khi chọn quận/huyện");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatAddress = (address: AddressData): string => {
  const parts: string[] = [];

  if (address.street) parts.push(address.street);
  if (address.wardName) parts.push(address.wardName);
  if (address.districtName) parts.push(address.districtName);
  if (address.cityName) parts.push(address.cityName);
  if (address.country) parts.push(address.country);

  return parts.join(", ");
};
