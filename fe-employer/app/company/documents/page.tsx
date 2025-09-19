"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, FileUp, ArrowLeft } from "lucide-react";
import { getToken } from "@/lib/userStorage";

interface DocState {
  document: File | null;
  documentNumber: string;
  issueDate: string; // yyyy-mm-dd
  issuePlace?: string; // only for business-license
  validUntil?: string;
}

const upload = async (
  path: string,
  fields: Record<string, any>,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      form.append(k, v as any);
    }
  });

  const res = await fetch(`http://localhost:3000/api${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  try {
    const data = await res.json();
    return {
      success: !!data?.success,
      message: data?.message,
      error: data?.error,
    };
  } catch (e) {
    return {
      success: res.ok,
      message: res.ok ? "Thành công" : undefined,
      error: res.ok ? undefined : "Tải lên thất bại",
    };
  }
};

export default function DocumentsPage() {
  const router = useRouter();

  const [bl, setBL] = useState<DocState>({
    document: null,
    documentNumber: "",
    issueDate: "",
    issuePlace: "",
    validUntil: "",
  });
  const [tc, setTC] = useState<DocState>({
    document: null,
    documentNumber: "",
    issueDate: "",
    validUntil: "",
  });

  const [loadingBL, setLoadingBL] = useState(false);
  const [loadingTC, setLoadingTC] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmitBL = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoadingBL(true);
    try {
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }
      if (!bl.document) {
        setError("Vui lòng chọn tệp Giấy phép đăng ký kinh doanh");
        return;
      }
      const result = await upload(
        "/employers/documents/business-license",
        {
          document: bl.document,
          documentNumber: bl.documentNumber,
          issueDate: bl.issueDate,
          issuePlace: bl.issuePlace,
          validUntil: bl.validUntil,
        },
        token
      );
      if (result.success) setSuccess(result.message || "Tải lên thành công");
      else setError(result.error || "Tải lên thất bại");
    } finally {
      setLoadingBL(false);
    }
  };

  const handleSubmitTC = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoadingTC(true);
    try {
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }
      if (!tc.document) {
        setError("Vui lòng chọn tệp Giấy chứng nhận đăng ký thuế");
        return;
      }
      const result = await upload(
        "/employers/documents/tax-certificate",
        {
          document: tc.document,
          documentNumber: tc.documentNumber,
          issueDate: tc.issueDate,
          validUntil: tc.validUntil,
        },
        token
      );
      if (result.success) setSuccess(result.message || "Tải lên thành công");
      else setError(result.error || "Tải lên thất bại");
    } finally {
      setLoadingTC(false);
    }
  };

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
                Giấy phép & Thuế
              </h1>
              <p className="text-slate-600">
                Tải lên giấy phép đăng ký kinh doanh và giấy chứng nhận đăng ký
                thuế
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Business License */}
        <Card>
          <CardHeader>
            <CardTitle>Giấy phép đăng ký kinh doanh</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBL} className="space-y-4">
              <div>
                <Label>Tệp giấy phép *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setBL({ ...bl, document: e.target.files?.[0] || null })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Số giấy phép *</Label>
                  <Input
                    value={bl.documentNumber}
                    onChange={(e) =>
                      setBL({ ...bl, documentNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Ngày cấp *</Label>
                  <Input
                    type="date"
                    value={bl.issueDate}
                    onChange={(e) =>
                      setBL({ ...bl, issueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nơi cấp</Label>
                  <Input
                    value={bl.issuePlace}
                    onChange={(e) =>
                      setBL({ ...bl, issuePlace: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Giá trị đến</Label>
                  <Input
                    type="date"
                    value={bl.validUntil}
                    onChange={(e) =>
                      setBL({ ...bl, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loadingBL}
                  className="flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />{" "}
                  {loadingBL ? "Đang tải..." : "Tải lên"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tax Certificate */}
        <Card>
          <CardHeader>
            <CardTitle>Giấy chứng nhận đăng ký thuế</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitTC} className="space-y-4">
              <div>
                <Label>Tệp giấy chứng nhận *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setTC({ ...tc, document: e.target.files?.[0] || null })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Số giấy tờ *</Label>
                  <Input
                    value={tc.documentNumber}
                    onChange={(e) =>
                      setTC({ ...tc, documentNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Ngày cấp *</Label>
                  <Input
                    type="date"
                    value={tc.issueDate}
                    onChange={(e) =>
                      setTC({ ...tc, issueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Giá trị đến</Label>
                  <Input
                    type="date"
                    value={tc.validUntil}
                    onChange={(e) =>
                      setTC({ ...tc, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loadingTC}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />{" "}
                  {loadingTC ? "Đang tải..." : "Tải lên"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
