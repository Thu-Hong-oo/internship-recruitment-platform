"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  FileUp,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import {
  getDocumentTypes,
  uploadDocument,
  updateDocument,
  deleteDocument,
  type DocumentType,
  type UploadedDocument,
  type DocumentTypesResponse,
} from "@/lib/documentAPI";
import { useVerificationContext } from "@/contexts/VerificationContext";

interface DocState {
  document: File | null;
  documentNumber: string;
  issueDate: string; // yyyy-mm-dd
  issuePlace?: string; // only for business-license
  validUntil?: string;
  reportYear?: string; // for financial-statement
  reportPeriod?: string; // for financial-statement
}

export default function DocumentsPage() {
  const router = useRouter();
  const { refreshVerification } = useVerificationContext();

  const [documentTypes, setDocumentTypes] =
    useState<DocumentTypesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // State cho form upload
  const [uploadForm, setUploadForm] = useState<Record<string, DocState>>({});

  // State cho chế độ cập nhật
  const [updateMode, setUpdateMode] = useState<Record<string, boolean>>({});

  // Load document types khi component mount
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        setLoading(true);
        const data = await getDocumentTypes();
        setDocumentTypes(data);

        // Initialize upload form state
        const initialForm: Record<string, DocState> = {};
        const initialUpdateMode: Record<string, boolean> = {};
        [...data.data.required, ...data.data.optional].forEach((docType) => {
          initialForm[docType.id] = {
            document: null,
            documentNumber: "",
            issueDate: "",
            issuePlace: "",
            validUntil: "",
            reportYear: "",
            reportPeriod: "",
          };
          initialUpdateMode[docType.id] = false;
        });
        setUploadForm(initialForm);
        setUpdateMode(initialUpdateMode);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin tài liệu"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocumentTypes();
  }, []);

  // Handle upload document
  const handleUpload = async (docTypeId: string, e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setUploading(docTypeId);

    try {
      const formData = uploadForm[docTypeId];
      if (!formData.document) {
        setError("Vui lòng chọn tệp tài liệu");
        return;
      }

      const metadata: Record<string, any> = {
        documentNumber: formData.documentNumber,
        issueDate: formData.issueDate,
        issuePlace: formData.issuePlace,
        validUntil: formData.validUntil,
        reportYear: formData.reportYear,
        reportPeriod: formData.reportPeriod,
      };

      const result = await uploadDocument(
        docTypeId,
        formData.document,
        metadata
      );

      if (result.success) {
        setSuccess(result.message || "Tải lên thành công");
        // Reload document types to get updated data
        const updatedData = await getDocumentTypes();
        setDocumentTypes(updatedData);
        // Refresh verification status
        refreshVerification();
        // Reset form
        setUploadForm((prev) => ({
          ...prev,
          [docTypeId]: {
            document: null,
            documentNumber: "",
            issueDate: "",
            issuePlace: "",
            validUntil: "",
            reportYear: "",
            reportPeriod: "",
          },
        }));
      } else {
        setError(result.error || "Tải lên thất bại");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải lên thất bại");
    } finally {
      setUploading(null);
    }
  };

  // Handle update document
  const handleUpdate = async (
    docTypeId: string,
    documentId: string,
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setUpdating(documentId);

    try {
      const formData = uploadForm[docTypeId];
      if (!formData.document) {
        setError("Vui lòng chọn tệp tài liệu mới để cập nhật");
        return;
      }

      const metadata: Record<string, any> = {
        documentNumber: formData.documentNumber,
        issueDate: formData.issueDate,
        issuePlace: formData.issuePlace,
        validUntil: formData.validUntil,
        reportYear: formData.reportYear,
        reportPeriod: formData.reportPeriod,
      };

      const result = await updateDocument(
        documentId,
        formData.document,
        metadata
      );

      if (result.success) {
        setSuccess(result.message || "Cập nhật thành công");
        // Reload document types to get updated data
        const updatedData = await getDocumentTypes();
        setDocumentTypes(updatedData);
        // Refresh verification status
        refreshVerification();
        // Reset form and exit update mode
        setUploadForm((prev) => ({
          ...prev,
          [docTypeId]: {
            document: null,
            documentNumber: "",
            issueDate: "",
            issuePlace: "",
            validUntil: "",
            reportYear: "",
            reportPeriod: "",
          },
        }));
        setUpdateMode((prev) => ({
          ...prev,
          [docTypeId]: false,
        }));
      } else {
        setError(result.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setUpdating(null);
    }
  };

  // Handle delete document
  const handleDelete = async (documentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;

    setSuccess("");
    setError("");
    setDeleting(documentId);

    try {
      const result = await deleteDocument(documentId);

      if (result.success) {
        setSuccess(result.message || "Xóa thành công");
        // Reload document types to get updated data
        const updatedData = await getDocumentTypes();
        setDocumentTypes(updatedData);
        // Refresh verification status
        refreshVerification();
      } else {
        setError(result.error || "Xóa thất bại");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeleting(null);
    }
  };

  // Get uploaded document by type
  const getUploadedDocument = (
    docTypeId: string
  ): UploadedDocument | undefined => {
    return documentTypes?.data.uploadedDocuments.find(
      (doc) => doc.documentType === docTypeId
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Get file size in MB
  const getFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!documentTypes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Không thể tải thông tin tài liệu</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Tài liệu công ty
              </h1>
              <p className="text-slate-600">
                Quản lý và tải lên các tài liệu cần thiết cho công ty
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Tiến độ hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tài liệu bắt buộc</span>
                <span className="text-sm text-gray-600">
                  {documentTypes.data.progress.uploadedRequired}/
                  {documentTypes.data.progress.totalRequired}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${documentTypes.data.progress.percentage}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {documentTypes.data.progress.percentage}% hoàn thành
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Tài liệu bắt buộc
          </h2>
          {documentTypes.data.required.map((docType) => {
            const uploadedDoc = getUploadedDocument(docType.id);
            const formData = uploadForm[docType.id] || {};
            const isUpdating = uploadedDoc
              ? updating === uploadedDoc._id
              : false;

            return (
              <Card key={docType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{docType.name}</CardTitle>
                      {uploadedDoc ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã tải lên
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Chưa tải lên
                        </Badge>
                      )}
                    </div>
                    {uploadedDoc && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(uploadedDoc.url, "_blank")}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(uploadedDoc.url, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Tải xuống
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Pre-fill form with existing data
                            setUploadForm((prev) => ({
                              ...prev,
                              [docType.id]: {
                                document: null,
                                documentNumber:
                                  uploadedDoc.metadata.documentNumber || "",
                                issueDate: uploadedDoc.metadata.issueDate || "",
                                issuePlace:
                                  uploadedDoc.metadata.issuePlace || "",
                                validUntil:
                                  uploadedDoc.metadata.validUntil || "",
                                reportYear:
                                  uploadedDoc.metadata.reportYear || "",
                                reportPeriod:
                                  uploadedDoc.metadata.reportPeriod || "",
                              },
                            }));
                            // Enter update mode
                            setUpdateMode((prev) => ({
                              ...prev,
                              [docType.id]: true,
                            }));
                            // Scroll to form
                            const formElement = document.getElementById(
                              `form-${docType.id}`
                            );
                            if (formElement) {
                              formElement.scrollIntoView({
                                behavior: "smooth",
                              });
                            }
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Cập nhật
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{docType.description}</p>
                </CardHeader>
                <CardContent>
                  {uploadedDoc && !updateMode[docType.id] ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tên tệp:</span>
                          <p className="text-gray-600">
                            {uploadedDoc.metadata.originalName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Kích thước:</span>
                          <p className="text-gray-600">
                            {getFileSize(uploadedDoc.metadata.size)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Ngày tải lên:</span>
                          <p className="text-gray-600">
                            {formatDate(uploadedDoc.uploadedAt)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Trạng thái:</span>
                          <p className="text-gray-600">
                            {uploadedDoc.verified
                              ? "Đã xác minh"
                              : "Chờ xác minh"}
                          </p>
                        </div>
                      </div>
                      {uploadedDoc.metadata.documentNumber && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Số tài liệu:</span>
                            <p className="text-gray-600">
                              {uploadedDoc.metadata.documentNumber}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Ngày cấp:</span>
                            <p className="text-gray-600">
                              {formatDate(uploadedDoc.metadata.issueDate!)}
                            </p>
                          </div>
                          {uploadedDoc.metadata.issuePlace && (
                            <div>
                              <span className="font-medium">Nơi cấp:</span>
                              <p className="text-gray-600">
                                {uploadedDoc.metadata.issuePlace}
                              </p>
                            </div>
                          )}
                          {uploadedDoc.metadata.validUntil && (
                            <div>
                              <span className="font-medium">Giá trị đến:</span>
                              <p className="text-gray-600">
                                {formatDate(uploadedDoc.metadata.validUntil)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form
                      id={`form-${docType.id}`}
                      onSubmit={(e) =>
                        uploadedDoc
                          ? handleUpdate(docType.id, uploadedDoc._id, e)
                          : handleUpload(docType.id, e)
                      }
                      className="space-y-4"
                    >
                      {updateMode[docType.id] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Chế độ cập nhật tài liệu
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Bạn đang cập nhật tài liệu hiện tại. Vui lòng chọn
                            tệp mới và cập nhật thông tin.
                          </p>
                        </div>
                      )}
                      <div>
                        <Label>Tệp tài liệu *</Label>
                        <Input
                          type="file"
                          accept={docType.validation.fileTypes
                            .map((type) => `.${type}`)
                            .join(",")}
                          onChange={(e) =>
                            setUploadForm((prev) => ({
                              ...prev,
                              [docType.id]: {
                                ...prev[docType.id],
                                document: e.target.files?.[0] || null,
                              },
                            }))
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Định dạng: {docType.validation.fileTypes.join(", ")} |
                          Tối đa: {docType.validation.maxSize}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docType.validation.metadataRequired.includes(
                          "documentNumber"
                        ) && (
                          <div>
                            <Label>Số tài liệu *</Label>
                            <Input
                              value={formData.documentNumber || ""}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    ...prev[docType.id],
                                    documentNumber: e.target.value,
                                  },
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                        {docType.validation.metadataRequired.includes(
                          "issueDate"
                        ) && (
                          <div>
                            <Label>Ngày cấp *</Label>
                            <Input
                              type="date"
                              value={formData.issueDate || ""}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    ...prev[docType.id],
                                    issueDate: e.target.value,
                                  },
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                        {docType.validation.metadataRequired.includes(
                          "issuePlace"
                        ) && (
                          <div>
                            <Label>Nơi cấp *</Label>
                            <Input
                              value={formData.issuePlace || ""}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    ...prev[docType.id],
                                    issuePlace: e.target.value,
                                  },
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                        {docType.validation.metadataRequired.includes(
                          "reportYear"
                        ) && (
                          <div>
                            <Label>Năm báo cáo *</Label>
                            <Input
                              type="number"
                              value={formData.reportYear || ""}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    ...prev[docType.id],
                                    reportYear: e.target.value,
                                  },
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                        {docType.validation.metadataRequired.includes(
                          "reportPeriod"
                        ) && (
                          <div>
                            <Label>Kỳ báo cáo *</Label>
                            <Input
                              value={formData.reportPeriod || ""}
                              onChange={(e) =>
                                setUploadForm((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    ...prev[docType.id],
                                    reportPeriod: e.target.value,
                                  },
                                }))
                              }
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        {updateMode[docType.id] && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // Reset form and exit update mode
                              setUploadForm((prev) => ({
                                ...prev,
                                [docType.id]: {
                                  document: null,
                                  documentNumber: "",
                                  issueDate: "",
                                  issuePlace: "",
                                  validUntil: "",
                                  reportYear: "",
                                  reportPeriod: "",
                                },
                              }));
                              setUpdateMode((prev) => ({
                                ...prev,
                                [docType.id]: false,
                              }));
                            }}
                          >
                            Hủy
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={uploading === docType.id || isUpdating}
                          className="flex items-center gap-2"
                        >
                          <FileUp className="w-4 h-4" />
                          {uploading === docType.id
                            ? "Đang tải..."
                            : isUpdating
                            ? "Đang cập nhật..."
                            : updateMode[docType.id]
                            ? "Cập nhật"
                            : "Tải lên"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Optional Documents */}
        {/* {documentTypes.data.optional.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Tài liệu tùy chọn
            </h2>
            {documentTypes.data.optional.map((docType) => {
              const uploadedDoc = getUploadedDocument(docType.id);
              const formData = uploadForm[docType.id] || {};

              return (
                <Card key={docType.id}>
          <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {docType.name}
                        </CardTitle>
                        {uploadedDoc ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đã tải lên
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Tùy chọn</Badge>
                        )}
                      </div>
                      {uploadedDoc && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(uploadedDoc.url, "_blank")
                            }
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(uploadedDoc.url, "_blank")
                            }
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Tải xuống
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(uploadedDoc._id)}
                            disabled={deleting === uploadedDoc._id}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {deleting === uploadedDoc._id
                              ? "Đang xóa..."
                              : "Xóa"}
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {docType.description}
                    </p>
          </CardHeader>
          <CardContent>
                    {uploadedDoc ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Tên tệp:</span>
                            <p className="text-gray-600">
                              {uploadedDoc.metadata.originalName}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Kích thước:</span>
                            <p className="text-gray-600">
                              {getFileSize(uploadedDoc.metadata.size)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Ngày tải lên:</span>
                            <p className="text-gray-600">
                              {formatDate(uploadedDoc.uploadedAt)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Trạng thái:</span>
                            <p className="text-gray-600">
                              {uploadedDoc.verified
                                ? "Đã xác minh"
                                : "Chờ xác minh"}
                            </p>
                          </div>
                        </div>
                        {uploadedDoc.metadata.documentNumber && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Số tài liệu:</span>
                              <p className="text-gray-600">
                                {uploadedDoc.metadata.documentNumber}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Ngày cấp:</span>
                              <p className="text-gray-600">
                                {formatDate(uploadedDoc.metadata.issueDate!)}
                              </p>
                            </div>
                            {uploadedDoc.metadata.issuePlace && (
                              <div>
                                <span className="font-medium">Nơi cấp:</span>
                                <p className="text-gray-600">
                                  {uploadedDoc.metadata.issuePlace}
                                </p>
                              </div>
                            )}
                            {uploadedDoc.metadata.validUntil && (
                              <div>
                                <span className="font-medium">
                                  Giá trị đến:
                                </span>
                                <p className="text-gray-600">
                                  {formatDate(uploadedDoc.metadata.validUntil)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                    <form
                      id={`form-${docType.id}`}
                      onSubmit={(e) => uploadedDoc ? handleUpdate(docType.id, uploadedDoc._id, e) : handleUpload(docType.id, e)}
                      className="space-y-4"
                    >
              <div>
                          <Label>Tệp tài liệu</Label>
                <Input
                  type="file"
                            accept={docType.validation.fileTypes
                              .map((type) => `.${type}`)
                              .join(",")}
                  onChange={(e) =>
                              setUploadForm((prev) => ({
                                ...prev,
                                [docType.id]: {
                                  ...prev[docType.id],
                                  document: e.target.files?.[0] || null,
                                },
                              }))
                            }
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Định dạng: {docType.validation.fileTypes.join(", ")}{" "}
                            | Tối đa: {docType.validation.maxSize}
                          </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {docType.validation.metadataRequired.includes(
                            "documentNumber"
                          ) && (
                <div>
                              <Label>Số tài liệu</Label>
                  <Input
                                value={formData.documentNumber || ""}
                    onChange={(e) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    [docType.id]: {
                                      ...prev[docType.id],
                                      documentNumber: e.target.value,
                                    },
                                  }))
                                }
                  />
                </div>
                          )}
                          {docType.validation.metadataRequired.includes(
                            "issueDate"
                          ) && (
                <div>
                              <Label>Ngày cấp</Label>
                  <Input
                    type="date"
                                value={formData.issueDate || ""}
                                onChange={(e) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    [docType.id]: {
                                      ...prev[docType.id],
                                      issueDate: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )}
                          {docType.validation.metadataRequired.includes(
                            "issuePlace"
                          ) && (
                            <div>
                              <Label>Nơi cấp</Label>
                              <Input
                                value={formData.issuePlace || ""}
                    onChange={(e) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    [docType.id]: {
                                      ...prev[docType.id],
                                      issuePlace: e.target.value,
                                    },
                                  }))
                                }
                  />
                </div>
                          )}
                          {docType.validation.metadataRequired.includes(
                            "reportYear"
                          ) && (
                            <div>
                              <Label>Năm báo cáo</Label>
                              <Input
                                type="number"
                                value={formData.reportYear || ""}
                                onChange={(e) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    [docType.id]: {
                                      ...prev[docType.id],
                                      reportYear: e.target.value,
                                    },
                                  }))
                                }
                              />
              </div>
                          )}
                          {docType.validation.metadataRequired.includes(
                            "reportPeriod"
                          ) && (
                <div>
                              <Label>Kỳ báo cáo</Label>
                  <Input
                                value={formData.reportPeriod || ""}
                    onChange={(e) =>
                                  setUploadForm((prev) => ({
                                    ...prev,
                                    [docType.id]: {
                                      ...prev[docType.id],
                                      reportPeriod: e.target.value,
                                    },
                                  }))
                    }
                  />
                </div>
                          )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                            disabled={uploading === docType.id}
                  className="flex items-center gap-2"
                >
                            <FileUp className="w-4 h-4" />
                            {uploading === docType.id
                              ? "Đang tải..."
                              : "Tải lên"}
                </Button>
              </div>
            </form>
                    )}
          </CardContent>
        </Card>
              );
            })}
          </div>
        )} */}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}
