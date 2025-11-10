import { useMemo, useRef } from "react";
import { templateLayouts } from "../../lib/mocks/templateLayouts";
import type { CVData } from "../../lib/mocks/cvSamples";

type Props = {
  data: CVData;
  containerRef?: (el: HTMLDivElement | null) => void;
  editable?: boolean;
  onChangeText?: (path: Array<string | number>, value: string) => void;
  onFocusField?: (fieldPath: string) => void;
  onBlurField?: () => void;
  editingField?: string | null;
};

export default function LivePreview({ data, containerRef, editable = false, onChangeText, onFocusField, onBlurField, editingField }: Props) {
  const layout = useMemo(() => templateLayouts[data.templateId], [data.templateId]);
  // Local buffer for inline text while editing, to avoid React-controlled rerenders
  const bufferRef = useRef<Map<string, string>>(new Map());
  const pageStyle = {
    width: layout.page.width,
    height: layout.page.height,
    position: "relative" as const,
    background: "#fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.08)",
    margin: "0 auto",
  };

  return (
    <div className="w-full overflow-auto">
      <div style={pageStyle} ref={containerRef || undefined}>
        {layout.sections.map((s, idx) => {
          const style: React.CSSProperties = {
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.width,
            height: s.height,
            padding: 8,
            overflow: "hidden",
          };
          const commonEditableProps = (path: Array<string | number>) => ({
            contentEditable: editable,
            suppressContentEditableWarning: true,
            spellCheck: false,
            onInput: (e: React.FormEvent<HTMLDivElement>) => {
              const text = (e.currentTarget.innerText || "");
              bufferRef.current.set(path.join("."), text);
            },
            onFocus: () => {
              onFocusField?.(path.join("."));
              // Initialize buffer with current text on focus
              const key = path.join(".");
              if (!bufferRef.current.has(key)) {
                const node = document.activeElement as HTMLElement | null;
                const text = node?.innerText ?? "";
                bufferRef.current.set(key, text);
              }
            },
            onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
              const key = path.join(".");
              const text = bufferRef.current.get(key) ?? e.currentTarget.innerText ?? "";
              bufferRef.current.delete(key);
              onChangeText?.(path, text);
              onBlurField?.();
            },
            onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            },
            style: {
              outline: editable ? "1px dashed rgba(59,130,246,0.7)" : "none",
              borderRadius: 4,
              padding: editable ? 4 : 0,
              minHeight: 16,
              cursor: editable ? "text" : "default",
              userSelect: "text",
            } as React.CSSProperties,
          });
          if (s.type === "personal") {
            return (
              <div key={idx} style={style}>
                <div
                  {...commonEditableProps(["personal", "name"])}
                  style={{
                    color: layout.colors.primary,
                    fontFamily: layout.fonts.heading,
                    fontSize: 24,
                    fontWeight: 700,
                    ...(commonEditableProps(["personal", "name"]).style as any),
                  }}
                >
                  {data.personal.name || "Your Name"}
                </div>
                <div style={{ color: layout.colors.secondary, fontFamily: layout.fonts.body, fontSize: 13 }}>
                  <span
                    {...commonEditableProps(["personal", "email"])}
                    style={{ ...(commonEditableProps(["personal", "email"]).style as any), display: "inline" }}
                  >
                    {data.personal.email || "email@example.com"}
                  </span>
                  <span> {data.personal.phone ? " • " : ""} </span>
                  <span
                    {...commonEditableProps(["personal", "phone"])}
                    style={{ ...(commonEditableProps(["personal", "phone"]).style as any), display: "inline" }}
                  >
                    {data.personal.phone || ""}
                  </span>
                </div>
                <div
                  {...commonEditableProps(["personal", "summary"])}
                  style={{ ...(commonEditableProps(["personal", "summary"]).style as any), marginTop: 8, fontSize: 12, color: "#111827", whiteSpace: "pre-wrap" }}
                >
                  {data.personal.summary || "Tóm tắt ngắn về kinh nghiệm và mục tiêu nghề nghiệp."}
                </div>
              </div>
            );
          }
          if (s.type === "experience") {
            return (
              <div key={idx} style={style}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Kinh nghiệm</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                  {data.experience.map((e, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 600 }}>
                        <span
                          {...commonEditableProps(["experience", i, "role"])}
                          style={{ ...(commonEditableProps(["experience", i, "role"]).style as any), display: "inline" }}
                        >
                          {e.role || "Vị trí"}
                        </span>{" "}
                        @{" "}
                        <span
                          {...commonEditableProps(["experience", i, "company"])}
                          style={{ ...(commonEditableProps(["experience", i, "company"]).style as any), display: "inline" }}
                        >
                          {e.company || "Công ty"}
                        </span>
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        <span
                          {...commonEditableProps(["experience", i, "startDate"])}
                          style={{ ...(commonEditableProps(["experience", i, "startDate"]).style as any), display: "inline" }}
                        >
                          {e.startDate || "YYYY-MM"}
                        </span>{" "}
                        -{" "}
                        <span
                          {...commonEditableProps(["experience", i, "endDate"])}
                          style={{ ...(commonEditableProps(["experience", i, "endDate"]).style as any), display: "inline" }}
                        >
                          {e.endDate || "Hiện tại"}
                        </span>
                      </div>
                      <div
                        {...commonEditableProps(["experience", i, "description"])}
                        style={{ ...(commonEditableProps(["experience", i, "description"]).style as any), marginTop: 4, whiteSpace: "pre-wrap" }}
                      >
                        {e.description || "Mô tả công việc, thành tựu nổi bật..."}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (s.type === "education") {
            return (
              <div key={idx} style={style}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Học vấn</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                  {data.education.map((e, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 600 }}>
                        <span
                          {...commonEditableProps(["education", i, "degree"])}
                          style={{ ...(commonEditableProps(["education", i, "degree"]).style as any), display: "inline" }}
                        >
                          {e.degree || "Bằng cấp"}
                        </span>
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        <span
                          {...commonEditableProps(["education", i, "school"])}
                          style={{ ...(commonEditableProps(["education", i, "school"]).style as any), display: "inline" }}
                        >
                          {e.school || "Trường"}
                        </span>{" "}
                        •{" "}
                        <span
                          {...commonEditableProps(["education", i, "startDate"])}
                          style={{ ...(commonEditableProps(["education", i, "startDate"]).style as any), display: "inline" }}
                        >
                          {e.startDate || "YYYY-MM"}
                        </span>{" "}
                        -{" "}
                        <span
                          {...commonEditableProps(["education", i, "endDate"])}
                          style={{ ...(commonEditableProps(["education", i, "endDate"]).style as any), display: "inline" }}
                        >
                          {e.endDate || "Hiện tại"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          if (s.type === "skills") {
            return (
              <div key={idx} style={style}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Kỹ năng</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.skills.map((sk, i) => (
                    <span
                      key={i}
                      {...commonEditableProps(["skills", i])}
                      style={{ ...(commonEditableProps(["skills", i]).style as any), fontSize: 12, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}
                    >
                      {sk || "Kỹ năng"}
                    </span>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}


