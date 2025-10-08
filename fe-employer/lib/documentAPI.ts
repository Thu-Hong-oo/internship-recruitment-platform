import { getToken } from "@/lib/userStorage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export interface DocumentValidation {
  metadataRequired: string[];
  fileTypes: string[];
  maxSize: string;
}

export interface DocumentType {
  id: string;
  name: string;
  nameEn: string;
  required: boolean;
  description: string;
  validation: DocumentValidation;
}

export interface UploadedDocument {
  _id: string;
  url: string;
  cloudinaryId: string;
  documentType: string;
  uploadedAt: string;
  verified: boolean;
  metadata: {
    documentNumber?: string;
    issueDate?: string;
    issuePlace?: string;
    validUntil?: string;
    reportYear?: string;
    reportPeriod?: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
}

export interface DocumentProgress {
  percentage: number;
  uploadedRequired: number;
  totalRequired: number;
  missingRequired: string[];
}

export interface RequiredCheck {
  allRequiredUploaded: boolean;
  missingRequired: string[];
  requiredCount: number;
  uploadedCount: number;
}

export interface DocumentTypesResponse {
  success: boolean;
  data: {
    industry: string;
    required: DocumentType[];
    optional: DocumentType[];
    uploadedDocuments: UploadedDocument[];
    progress: DocumentProgress;
    requiredCheck: RequiredCheck;
  };
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Lấy danh sách loại tài liệu và trạng thái upload
export const getDocumentTypes = async (): Promise<DocumentTypesResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(`${API_BASE_URL}/employers/document-types`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải thông tin tài liệu");
  }

  return response.json();
};

// Upload tài liệu
export const uploadDocument = async (
  documentType: string,
  document: File,
  metadata: Record<string, any>
): Promise<UploadResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const form = new FormData();
  form.append("document", document);

  // Chỉ thêm metadata không rỗng
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, value as any);
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/employers/documents/${documentType}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  try {
    const data = await response.json();
    return {
      success: !!data?.success,
      message: data?.message,
      error: data?.error,
    };
  } catch (e) {
    return {
      success: response.ok,
      message: response.ok ? "Thành công" : undefined,
      error: response.ok ? undefined : "Tải lên thất bại",
    };
  }
};

// Cập nhật tài liệu (sử dụng PUT với documentId)
export const updateDocument = async (
  documentId: string,
  document: File,
  metadata: Record<string, any>
): Promise<UploadResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const form = new FormData();
  form.append("document", document);

  // Chỉ thêm metadata không rỗng
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, value as any);
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/employers/documents/${documentId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  try {
    const data = await response.json();
    return {
      success: !!data?.success,
      message: data?.message,
      error: data?.error,
    };
  } catch (e) {
    return {
      success: response.ok,
      message: response.ok ? "Cập nhật thành công" : undefined,
      error: response.ok ? undefined : "Cập nhật thất bại",
    };
  }
};

// Xóa tài liệu
export const deleteDocument = async (
  documentId: string
): Promise<UploadResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  const response = await fetch(
    `${API_BASE_URL}/employers/documents/${documentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  try {
    const data = await response.json();
    return {
      success: !!data?.success,
      message: data?.message,
      error: data?.error,
    };
  } catch (e) {
    return {
      success: response.ok,
      message: response.ok ? "Xóa thành công" : undefined,
      error: response.ok ? undefined : "Xóa thất bại",
    };
  }
};
