import InlineText from "./InlineText";
import type { CVData } from "../../../lib/mocks/cvSamples";
import { templateLayouts } from "../../../lib/mocks/templateLayouts";

type Props = {
  data: CVData;
  editable: boolean;
  onChangeText?: (path: Array<string | number>, value: string) => void;
  onFocusField?: (fieldPath: string) => void;
  onBlurField?: () => void;
};

export default function Template1Renderer({ data, editable, onChangeText, onFocusField, onBlurField }: Props) {
  const layout = templateLayouts[data.templateId];
  const pink = layout.colors.primary; // #ff6b9d
  const neutral = layout.colors.secondary; // #2D3E50
  return (
    <div className="w-full h-full" style={{ fontFamily: layout.fonts.body }}>
      <div className="flex flex-col gap-8 p-6" style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #ffeef8 0%, #e0f7ff 50%, #ffe8f0 100%)" }}>
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start gap-6">
          <div
            className="flex items-center justify-center rounded-full text-white text-3xl font-bold"
            style={{
              width: 96,
              height: 96,
              background: "linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)",
              boxShadow: "0 8px 20px rgba(255, 107, 157, 0.25)",
              flexShrink: 0,
            }}
          >
            NV
          </div>
          <div className="flex-1">
            <div className="mb-2" style={{ width: 60, height: 4, background: "linear-gradient(to right, #ff6b9d, #ffb3d9)", borderRadius: 2 }} />
            <InlineText
              path={["personal", "name"]}
              value={data.personal.name}
              placeholder="NGUYỄN VĂN DU"
              editable={editable}
              onChangeText={onChangeText}
              onFocusField={onFocusField}
              onBlurField={onBlurField}
              block
              className="font-bold"
              style={{ fontSize: 40, color: pink, lineHeight: 1.1 }}
            />
            <InlineText
              path={["personal", "summary"]}
              value={data.personal.summary || ""}
              placeholder="Chuyên gia du lịch với 8 năm kinh nghiệm..."
              editable={editable}
              onChangeText={onChangeText}
              onFocusField={onFocusField}
              onBlurField={onBlurField}
              block
              className="mt-3"
              style={{ color: "#4b5563" }}
            />
            <div className="flex flex-wrap gap-4 text-sm mt-3">
              <div className="flex items-center gap-2">
                <span>📧</span>
                <InlineText
                  path={["personal", "email"]}
                  value={data.personal.email}
                  placeholder="email@example.com"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={onFocusField}
                  onBlurField={onBlurField}
                  className="font-medium"
                  style={{ color: pink }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <InlineText
                  path={["personal", "phone"]}
                  value={data.personal.phone || ""}
                  placeholder="+84 98 765 4321"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={onFocusField}
                  onBlurField={onBlurField}
                  className="font-medium"
                  style={{ color: "#374151" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <InlineText
                  path={["personal", "address"]}
                  value={data.personal.address || ""}
                  placeholder="Hà Nội, Việt Nam"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={onFocusField}
                  onBlurField={onBlurField}
                  className="font-medium"
                  style={{ color: "#374151" }}
                />
              </div>
            </div>
          </div>
        </header>
        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Experience */}
            <section>
              <div className="mb-4" style={{ color: pink, position: "relative", paddingLeft: 16, fontSize: 24, fontWeight: 700 }}>
                <span style={{ position: "absolute", left: 0, top: 0 }}>✈</span> Kinh Nghiệm Làm Việc
              </div>
              <div className="space-y-4">
                {data.experience.map((e, i) => (
                  <div key={i} className="rounded-2xl p-5" style={{ background: "#fff", borderLeft: `5px solid ${pink}`, boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <InlineText path={["experience", i, "role"]} value={e.role} placeholder="Chức danh" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="text-xl font-semibold" style={{ color: "#111827" }} />
                        <InlineText path={["experience", i, "company"]} value={e.company} placeholder="Công ty" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-medium" style={{ color: pink }} />
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        <InlineText path={["experience", i, "startDate"]} value={e.startDate} placeholder="YYYY" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                        {" - "}
                        <InlineText path={["experience", i, "endDate"]} value={e.endDate || "Hiện tại"} placeholder="YYYY" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                      </div>
                    </div>
                    <InlineText path={["experience", i, "description"]} value={e.description || ""} placeholder="Mô tả công việc..." editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} block className="text-gray-600" />
                  </div>
                ))}
              </div>
            </section>
            {/* Education */}
            <section>
              <div className="mb-4" style={{ color: pink, position: "relative", paddingLeft: 16, fontSize: 24, fontWeight: 700 }}>
                <span style={{ position: "absolute", left: 0, top: 0 }}>✈</span> Học Vấn
              </div>
              <div className="space-y-3">
                {data.education.map((e, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", borderLeft: `5px solid ${pink}`, boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
                    <InlineText path={["education", i, "degree"]} value={e.degree} placeholder="Bằng cấp" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="text-lg font-semibold" style={{ color: "#111827" }} />
                    <InlineText path={["education", i, "school"]} value={e.school} placeholder="Trường" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-medium" style={{ color: pink }} />
                    <div className="text-sm text-gray-500">
                      <InlineText path={["education", i, "startDate"]} value={e.startDate} placeholder="YYYY" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                      {" - "}
                      <InlineText path={["education", i, "endDate"]} value={e.endDate || ""} placeholder="YYYY" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {/* Projects */}
            <section>
              <div className="mb-4" style={{ color: pink, position: "relative", paddingLeft: 16, fontSize: 24, fontWeight: 700 }}>
                <span style={{ position: "absolute", left: 0, top: 0 }}>✈</span> Dự Án Nổi Bật
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(data.projects || []).map((p, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", borderLeft: `4px solid ${pink}`, boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
                    <InlineText path={["projects", i, "title"]} value={p.title} placeholder="Tên dự án" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-semibold" style={{ color: "#111827" }} />
                    <InlineText path={["projects", i, "description"]} value={p.description || ""} placeholder="Mô tả" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} block className="text-sm text-gray-600" />
                  </div>
                ))}
              </div>
            </section>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Languages */}
            <section className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
              <div className="text-lg font-bold mb-3" style={{ color: pink, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🗣️</span> Ngôn Ngữ
              </div>
              <div className="space-y-3">
                {(data.languages || []).map((l, i) => (
                  <div key={i}>
                    <InlineText path={["languages", i, "name"]} value={l.name} placeholder="Ngôn ngữ" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-semibold" style={{ color: "#374151" }} />
                    <InlineText path={["languages", i, "level"]} value={l.level || ""} placeholder="Trình độ" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="text-xs text-gray-500 block" />
                  </div>
                ))}
              </div>
            </section>
            {/* Skills */}
            <section className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
              <div className="text-lg font-bold mb-3" style={{ color: pink, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⭐</span> Kỹ Năng
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((sk, i) => (
                  <InlineText
                    key={i}
                    path={["skills", i]}
                    value={sk}
                    placeholder="Kỹ năng"
                    editable={editable}
                    onChangeText={onChangeText}
                    onFocusField={onFocusField}
                    onBlurField={onBlurField}
                    className="px-3 py-1 text-sm font-semibold"
                    style={{ color: "#fff", background: "linear-gradient(135deg, #ff99bb, #ffb3d9)", borderRadius: 25 }}
                  />
                ))}
              </div>
            </section>
            {/* Certifications */}
            <section className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(255,107,157,0.08)" }}>
              <div className="text-lg font-bold mb-3" style={{ color: pink, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏆</span> Chứng Chỉ
              </div>
              <div className="space-y-3 text-sm">
                {(data.certifications || []).map((c, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl" style={{ background: "#ffebf0", color: pink, border: "2px solid #ff99bb" }}>
                    <InlineText path={["certifications", i, "name"]} value={c.name} placeholder="Tên chứng chỉ" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-semibold block" />
                    <div className="opacity-70">
                      <InlineText path={["certifications", i, "issuer"]} value={c.issuer || ""} placeholder="Tổ chức" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />{" "}
                      <InlineText path={["certifications", i, "year"]} value={c.year || ""} placeholder="Năm" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {/* Social */}
            <section className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #ff6b9d, #c44569)" }}>
              <div className="text-lg font-bold mb-3">Kết Nối</div>
              <div className="space-y-2 text-sm">
                {(data.social || []).map((s, i) => (
                  <div key={i} className="hover:opacity-80 transition">
                    <InlineText path={["social", i, "label"]} value={s.label} placeholder="Link" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} className="font-medium" />{" "}
                    <InlineText path={["social", i, "url"]} value={s.url} placeholder="#" editable={editable} onChangeText={onChangeText} onFocusField={onFocusField} onBlurField={onBlurField} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}









