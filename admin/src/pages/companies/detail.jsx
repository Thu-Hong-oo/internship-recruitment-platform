import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import companiesAPI from "../../api/companies";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await companiesAPI.getCompanyDetail(id);
        setCompany(res.data);
      } catch (e) {
        setError(e?.message || "Không tải được chi tiết công ty");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!company) return <div className="p-6">Không có dữ liệu</div>;

  const formatDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
  const canVerify = Boolean(
    company?.verification?.documents?.length >= 2 &&
      company?.status !== "verified"
  );

  const isVerified = company?.status === "verified";

  const handleVerify = async () => {
    if (!canVerify) return;
    if (
      !confirm(
        "Xác thực công ty này? Hành động này sẽ đánh dấu công ty là đã xác minh."
      )
    )
      return;
    try {
      setLoading(true);
      const res = await companiesAPI.updateCompanyStatus(
        company._id,
        "verified"
      );
      if (res?.success) {
        const refreshed = await companiesAPI.getCompanyDetail(company._id);
        setCompany(refreshed.data);
        alert("Xác thực công ty thành công!");
      } else {
        alert(res?.message || "Cập nhật trạng thái thất bại");
      }
    } catch (e) {
      alert(e?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-slate-500 text-sm">ID: {company._id}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isVerified && canVerify && (
            <button
              className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
              onClick={handleVerify}
              disabled={!canVerify || loading}
            >
              Xác thực công ty
            </button>
          )}
          {isVerified && (
            <span className="px-3 py-2 rounded bg-green-100 text-green-800 border border-green-200">
              ✓ Đã xác thực
            </span>
          )}
          <button
            className="px-3 py-2 rounded border"
            onClick={() =>
              navigate("/admin/companies", { state: { refresh: true } })
            }
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-xl bg-white p-4">
            <div className="flex gap-4 items-center">
              <img
                src={company?.logo?.url}
                alt="logo"
                className="h-14 w-14 rounded object-cover border"
              />
              <div>
                <div className="text-lg font-medium">{company.name}</div>
                <div className="text-sm text-slate-500">
                  {company.industry} • {company.size}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                {company.email || "—"}
              </div>
              <div>
                <span className="text-slate-500">Website:</span>{" "}
                {company.website || "—"}
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Mô tả:</span>{" "}
                {company.description || "—"}
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white p-4">
            <div className="font-medium mb-3">Thông tin doanh nghiệp</div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Mã ĐKKD:</span>{" "}
                {company?.businessInfo?.registrationNumber || "—"}
              </div>
              <div>
                <span className="text-slate-500">MST:</span>{" "}
                {company?.businessInfo?.taxId || "—"}
              </div>
              <div>
                <span className="text-slate-500">Ngày cấp:</span>{" "}
                {company?.businessInfo?.issueDate
                  ? new Date(company.businessInfo.issueDate).toLocaleDateString(
                      "vi-VN"
                    )
                  : "—"}
              </div>
              <div>
                <span className="text-slate-500">Nơi cấp:</span>{" "}
                {company?.businessInfo?.issuePlace || "—"}
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500">Địa chỉ:</span>{" "}
                {company?.businessInfo?.address
                  ? `${company.businessInfo.address.street}, ${company.businessInfo.address.ward}, ${company.businessInfo.address.district}, ${company.businessInfo.address.city}`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="border rounded-xl bg-white p-4">
            <div className="font-medium mb-3">Tài liệu xác minh</div>
            <div className="space-y-3">
              {company?.verification?.documents?.length ? (
                company.verification.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-start justify-between border rounded p-3"
                  >
                    <div>
                      <div className="font-medium">{doc.documentType}</div>
                      <div className="text-sm text-slate-500">
                        Tải lên: {formatDate(doc.uploadedAt)}
                      </div>
                      <div className="text-sm text-slate-500">
                        Số: {doc?.metadata?.documentNumber || "—"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        className="px-2 py-1 rounded border"
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Xem
                      </a>
                      <span
                        className={`px-2 py-1 rounded border text-xs ${
                          doc.verified
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {" "}
                        {doc.verified ? "Đã xác minh" : "Chờ xác minh"}{" "}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Chưa có tài liệu</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-xl bg-white p-4">
            <div className="font-medium mb-2">Liên hệ</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-slate-500">Người liên hệ:</span>{" "}
                {company?.contact?.name || "—"}
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                {company?.contact?.email || "—"}
              </div>
              <div>
                <span className="text-slate-500">Điện thoại:</span>{" "}
                {company?.contact?.phone || "—"}
              </div>
            </div>
          </div>
          <div className="border rounded-xl bg-white p-4">
            <div className="font-medium mb-2">Trạng thái & xác minh</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-slate-500">Trạng thái:</span>{" "}
                {company.status}
              </div>
              <div>
                <span className="text-slate-500">Xác minh:</span>{" "}
                {company?.status === "verified"
                  ? "Đã xác minh"
                  : "Chưa xác minh"}
              </div>
              <div>
                <span className="text-slate-500">Bước:</span> Cơ bản:{" "}
                {company?.verification?.steps?.basicInfo ? "✓" : "✗"} • Doanh
                nghiệp: {company?.verification?.steps?.businessInfo ? "✓" : "✗"}{" "}
                • Admin duyệt:{" "}
                {company?.verification?.steps?.adminApproved ? "✓" : "✗"}
              </div>
              <div>
                <span className="text-slate-500">Tạo lúc:</span>{" "}
                {formatDate(company.createdAt)}
              </div>
              <div>
                <span className="text-slate-500">Cập nhật:</span>{" "}
                {formatDate(company.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
