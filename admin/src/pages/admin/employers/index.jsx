import { useEffect, useMemo, useState } from "react";
import employersAPI from "../../../api/employers";
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

const StatCard = ({ label, value, Icon, colorClass = "text-slate-900" }) => (
  <div className="border border-border bg-white rounded-xl p-6 transition-colors hover:bg-slate-50">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </div>
      <div className={`rounded-lg bg-slate-100 p-2 ${colorClass}`}>
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </div>
    </div>
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border";
  const variants = {
    default: "bg-slate-900 text-white border-transparent",
    secondary: "bg-slate-100 text-slate-800 border-slate-200",
    outline: "bg-white text-slate-700 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`${base} ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default function EmployersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    approved: 0,
    withProfiles: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    verified: "all",
    industry: "all",
  });

  const load = async (override = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await employersAPI.getEmployers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        ...override,
      });
      setItems(res.data);
      setSummary(res.summary);
      setPagination(res.pagination);
      setFilters(res.filters || filters);
    } catch (e) {
      setError(e?.message || "Lỗi tải danh sách nhà tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load({ page: 1 });
  };

  const pageLabel = useMemo(() => {
    const p = Number(pagination.page) || 1;
    const tp = Number(pagination.totalPages) || 1;
    return `${p}/${tp}`;
  }, [pagination]);

  const statusToBadge = (status) => {
    if (status === "pending")
      return <Badge variant="secondary">Đang chờ</Badge>;
    if (status === "verified")
      return <Badge variant="default">Đã xác minh</Badge>;
    if (status === "no_profile")
      return <Badge variant="outline">Chưa có hồ sơ</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Quản lý Nhà tuyển dụng
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi và quản lý tất cả nhà tuyển dụng trong hệ thống
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Tổng"
            value={summary?.total ?? 0}
            Icon={Users}
            colorClass="text-slate-900"
          />
          <StatCard
            label="Đã xác minh"
            value={summary?.verified ?? 0}
            Icon={UserCheck}
            colorClass="text-emerald-600"
          />
          <StatCard
            label="Đang chờ"
            value={summary?.pending ?? 0}
            Icon={Clock}
            colorClass="text-amber-600"
          />
          <StatCard
            label="Đã duyệt"
            value={summary?.approved ?? 0}
            Icon={CheckCircle2}
            colorClass="text-emerald-600"
          />
          <StatCard
            label="Có hồ sơ"
            value={summary?.withProfiles ?? 0}
            Icon={FileText}
            colorClass="text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="border border-border bg-white rounded-xl p-6">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="Tìm theo tên, email, công ty"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                className="w-full pl-9 bg-white border border-slate-200 rounded px-3 py-2"
              />
            </div>
            <select
              className="bg-white border border-slate-200 rounded px-3 py-2"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Đang chờ</option>
              <option value="verified">Đã xác minh</option>
              <option value="no_profile">Chưa có hồ sơ</option>
            </select>
            <select
              className="bg-white border border-slate-200 rounded px-3 py-2"
              value={filters.verified}
              onChange={(e) =>
                setFilters((f) => ({ ...f, verified: e.target.value }))
              }
            >
              <option value="all">Tất cả xác minh</option>
              <option value="true">Đã xác minh</option>
              <option value="false">Chưa xác minh</option>
            </select>
          </form>
        </div>

        {/* Table */}
        <div className="border border-border bg-white rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left">
                  <th className="px-6 py-3 font-semibold">Nhà tuyển dụng</th>
                  <th className="px-6 py-3 font-semibold">Công ty</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold">Xác minh</th>
                  <th className="px-6 py-3 font-semibold">Tạo lúc</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-6 py-6" colSpan={6}>
                      Đang tải...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-6 py-6 text-red-600" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                ) : items?.length ? (
                  items.map((it) => (
                    <tr
                      key={it._id}
                      className="border-t border-border hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {it?.user?.fullName || "—"}
                          </p>
                          <p className="text-sm text-slate-500 font-mono">
                            {it?.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">
                          {it?.company?.name ? (
                            it.company.name
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">{statusToBadge(it?.status)}</td>
                      <td className="px-6 py-4">
                        {it?.verification?.isVerified ? (
                          <Badge variant="success">Đã xác minh</Badge>
                        ) : (
                          <span className="text-sm text-slate-500">Chưa xác minh</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-slate-500">
                          {it?.user?.createdAt
                            ? new Date(it.user.createdAt).toLocaleString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-6" colSpan={6}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-slate-600">Trang {pageLabel}</p>
            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded border border-slate-200 bg-transparent disabled:opacity-50"
                disabled={!pagination.hasPrevPage}
                onClick={() =>
                  load({ page: Math.max(1, Number(pagination.page) - 1) })
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded border border-slate-200 bg-transparent disabled:opacity-50"
                disabled={!pagination.hasNextPage}
                onClick={() => load({ page: Number(pagination.page) + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
