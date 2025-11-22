const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface CompanyFormData {
  company: {
    name: string;
    industry: string;
    size: string;
    email: string;
    website: string;
    description: string;
    foundedYear: number | "";
    employeesCount: number | "";
  };
  businessInfo: {
    registrationNumber: string;
    taxId: string;
    issueDate: string; // yyyy-mm-dd
    issuePlace: string;
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      country: string;
    };
  };
  legalRepresentative: {
    fullName: string;
    position: string;
    phone: string;
    email: string;
  };
}

export interface CompanyResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// Get company information
export const getCompanyInfo = async (
  token: string
): Promise<CompanyResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/employers/company`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data?.data,
      message: data?.message,
      error: data?.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Update company information
export const updateCompanyInfo = async (
  token: string,
  companyData: CompanyFormData
): Promise<CompanyResponse> => {
  try {
    // Format website: add http:// if missing protocol
    let formattedWebsite = companyData.company.website;
    if (formattedWebsite && formattedWebsite.trim() !== "") {
      formattedWebsite = formattedWebsite.trim();
      if (!formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
        formattedWebsite = `https://${formattedWebsite}`;
      }
    }

    // Clean company data: convert empty strings to undefined for optional numeric fields
    const cleanedCompany = {
      ...companyData.company,
      website: formattedWebsite || undefined,
      foundedYear:
        companyData.company.foundedYear === "" || companyData.company.foundedYear === undefined
          ? undefined
          : companyData.company.foundedYear,
      employeesCount:
        companyData.company.employeesCount === "" || companyData.company.employeesCount === undefined
          ? undefined
          : companyData.company.employeesCount,
    };

    const body = {
      company: cleanedCompany,
      businessInfo: {
        registrationNumber: companyData.businessInfo.registrationNumber,
        taxId: companyData.businessInfo.taxId,
        issueDate: companyData.businessInfo.issueDate
          ? new Date(companyData.businessInfo.issueDate).toISOString()
          : "",
        issuePlace: companyData.businessInfo.issuePlace,
        address: companyData.businessInfo.address,
      },
      legalRepresentative: companyData.legalRepresentative,
    };

    const response = await fetch(`${API_BASE_URL}/employers/company`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Format error message - handle array or object errors
    let errorMessage = "";
    if (data?.error) {
      if (Array.isArray(data.error)) {
        // Joi validation errors array
        errorMessage = data.error
          .map((err: any) => {
            if (typeof err === "string") return err;
            if (err?.message) return err.message;
            return JSON.stringify(err);
          })
          .join("\n");
      } else if (typeof data.error === "string") {
        errorMessage = data.error;
      } else if (data.error?.message) {
        errorMessage = data.error.message;
      } else {
        errorMessage = JSON.stringify(data.error);
      }
    }

    return {
      success: data?.success,
      message: data?.message,
      error: errorMessage || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Upload company logo
export const uploadCompanyLogo = async (
  token: string,
  file: File
): Promise<CompanyResponse> => {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(`${API_BASE_URL}/employers/upload-logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || data?.message || "Tải logo thất bại");
    }

    const logoUrl =
      data?.data?.logo?.url || data?.data?.company?.logo?.url || data?.url;

    return {
      success: true,
      data: { logoUrl },
      message: "Tải logo thành công",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể tải logo",
    };
  }
};

// Upload company cover image
export const uploadCompanyCoverImage = async (
  token: string,
  file: File
): Promise<CompanyResponse> => {
  try {
    const formData = new FormData();
    formData.append("coverImage", file);

    const response = await fetch(
      `${API_BASE_URL}/employers/upload-cover-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || data?.message || "Tải ảnh bìa thất bại");
    }

    const coverImageUrl =
      data?.data?.coverImage?.url ||
      data?.data?.company?.coverImage?.url ||
      data?.url;

    return {
      success: true,
      data: { coverImageUrl },
      message: "Tải ảnh bìa thành công",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể tải ảnh bìa",
    };
  }
};

