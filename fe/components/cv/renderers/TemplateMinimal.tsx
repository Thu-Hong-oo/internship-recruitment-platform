 import InlineText from "./InlineText";
import type { CVData } from "../../../lib/mocks/cvSamples";
import React, { useState, useRef, useEffect } from "react";

type Props = {
  data: CVData;
  containerRef?: (el: HTMLDivElement | null) => void;
  editable?: boolean;
  onChangeText?: (path: Array<string | number>, value: string) => void;
  onFocusField?: (fieldPath: string) => void;
  onBlurField?: () => void;
  onAddItem?: (section: keyof CVData, index?: number) => void;
  onDeleteItem?: (section: keyof CVData, index: number) => void;
  onDuplicateItem?: (section: keyof CVData, index: number) => void;
  onMoveItemUp?: (section: keyof CVData, index: number) => void;
  onMoveItemDown?: (section: keyof CVData, index: number) => void;
  onUpdateSectionTitle?: (section: string, newTitle: string) => void;
  getSectionTitle?: (section: string, defaultTitle: string) => string;
  onAvatarChange?: (file: File) => void;
};

// Minimal color scheme - subtle grays with refined palette
const ACCENT = "#4b5563"; // Refined gray accent color
const TEXT = "#111827"; // Darker text for better contrast
const BORDER = "#d1d5db"; // Subtle border/separator
const SECONDARY_TEXT = "#6b7280"; // Medium gray for secondary text
const LIGHT_BG = "#f9fafb"; // Light background for subtle sections
const PRIMARY_ACCENT = "#3b82f6"; // Subtle blue accent for highlights

const SectionWrapper = ({
  sectionKey,
  defaultTitle,
  children,
  editable = false,
  onAddItem,
  onUpdateSectionTitle,
  getSectionTitle,
}: {
  sectionKey: string;
  defaultTitle: string;
  children: React.ReactNode;
  editable?: boolean;
  onAddItem?: (section: keyof CVData, index?: number) => void;
  onUpdateSectionTitle?: (section: string, newTitle: string) => void;
  getSectionTitle?: (section: string, defaultTitle: string) => string;
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const title = getSectionTitle
    ? getSectionTitle(sectionKey, defaultTitle)
    : defaultTitle;

  const handleTitleClick = () => {
    if (editable && onUpdateSectionTitle) {
      setIsEditingTitle(true);
      setTempTitle(title);
    }
  };

  const handleTitleBlur = () => {
    if (onUpdateSectionTitle && tempTitle.trim()) {
      onUpdateSectionTitle(sectionKey, tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTempTitle(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-xs font-bold border-none outline-none bg-transparent"
            style={{ color: ACCENT, minWidth: 100 }}
            autoFocus
          />
        ) : (
          <div
            className="text-xs font-bold tracking-wider cursor-pointer uppercase"
            style={{ color: ACCENT, letterSpacing: "0.1em" }}
            onClick={handleTitleClick}
            title={editable ? "Click to edit title" : undefined}
          >
            {title}
          </div>
        )}
        <div className="flex-1 h-0.5" style={{ backgroundColor: BORDER }} />
      </div>
      <div style={{ minHeight: 20 }}>{children}</div>
    </div>
  );
};

const BulletList = ({
  items,
  render,
}: {
  items: any[];
  render: (item: any, index: number) => React.ReactNode;
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm" style={{ color: SECONDARY_TEXT }}>
        -
      </div>
    );
  }
  return <div className="flex flex-col gap-2">{items.map(render)}</div>;
};

const ItemControls = ({
  section,
  index,
  totalItems,
  editable,
  onDeleteItem,
  onAddItem,
  onMoveItemUp,
  onMoveItemDown,
  show,
}: {
  section: keyof CVData;
  index: number;
  totalItems: number;
  editable?: boolean;
  onDeleteItem?: (section: keyof CVData, index: number) => void;
  onAddItem?: (section: keyof CVData, index?: number) => void;
  onMoveItemUp?: (section: keyof CVData, index: number) => void;
  onMoveItemDown?: (section: keyof CVData, index: number) => void;
  show?: boolean;
}) => {
  if (!editable || !show) return null;

  const canMoveUp = index > 0;
  const canMoveDown = index < totalItems - 1;

  const showAddButton = [
    "education",
    "experience",
    "projects",
    "skills",
    "hobbies",
    "certifications",
    "awards",
  ].includes(section as string);

  const allowDeleteWithOneItem = [
    "hobbies",
    "certifications",
    "awards",
  ].includes(section as string);

  return (
    <div className="flex items-center gap-1 mb-1">
      <button
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-move"
        style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
        title="Kéo để di chuyển"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 18h2"></path>
          <path d="M11 6h2"></path>
          <path d="M18 11v2"></path>
          <path d="M6 11v2"></path>
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveItemUp?.(section, index);
        }}
        disabled={!canMoveUp}
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
        title="Di chuyển lên"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 15l-6-6-6 6"></path>
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveItemDown?.(section, index);
        }}
        disabled={!canMoveDown}
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
        title="Di chuyển xuống"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      {showAddButton ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItem?.(section, index);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded border-none transition-colors flex items-center gap-1"
            style={{ backgroundColor: "#10b981", color: "white" }}
            title="Thêm mục mới"
          >
            <span>+</span>
            <span>Thêm</span>
          </button>
          {(totalItems >= 2 || allowDeleteWithOneItem) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem?.(section, index);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded border-none transition-colors"
              style={{ backgroundColor: "#ef4444", color: "white" }}
              title="Xóa"
            >
              Xóa
            </button>
          )}
        </>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem?.(section, index);
          }}
          className="px-3 py-1.5 text-xs font-medium rounded border-none transition-colors"
          style={{ backgroundColor: "#ef4444", color: "white" }}
          title="Xóa"
        >
          Xóa
        </button>
      )}
    </div>
  );
};

export default function TemplateMinimalRenderer({
  data,
  containerRef,
  editable = false,
  onChangeText,
  onFocusField,
  onBlurField,
  onAddItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItemUp,
  onMoveItemDown,
  onUpdateSectionTitle,
  getSectionTitle,
  onAvatarChange,
}: Props) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const initials =
    data.personal.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NV";

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const defaultAvatarUrl = "/images/avatar_trang.jpg";
  const dataAvatar = (data.personal as any).avatar;
  const avatarUrl = previewAvatar || dataAvatar || defaultAvatarUrl;

  useEffect(() => {
    if (dataAvatar && previewAvatar) {
      URL.revokeObjectURL(previewAvatar);
      setPreviewAvatar(null);
    }
  }, [dataAvatar]);

  const handleAvatarClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatar(previewUrl);
      if (onAvatarChange) {
        onAvatarChange(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  const handleFocusField = (fieldPath: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const parts = fieldPath.split(".");
    if (parts.length >= 2) {
      const section = parts[0];
      const index = parts[1];
      setFocusedItem(`${section}.${index}`);
    }
    onFocusField?.(fieldPath);
  };

  const handleBlurField = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      const activeElement = document.activeElement;
      const isContentEditable = activeElement?.hasAttribute("contenteditable");
      if (!isContentEditable) {
        setFocusedItem(null);
      }
      blurTimeoutRef.current = null;
    }, 150);
    onBlurField?.();
  };

  const isItemActive = (section: string, index: number) => {
    const itemKey = `${section}.${index}`;
    return hoveredItem === itemKey || (focusedItem === itemKey && !hoveredItem);
  };

  return (
    <div className="w-full overflow-auto">
      <div
        ref={containerRef || undefined}
        className="mx-auto bg-white"
        style={{
          width: 794,
          minHeight: 1123,
          padding: "48px 56px 56px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          color: TEXT,
          lineHeight: 1.6,
        }}
      >
        {/* Main content - 2 columns with avatar in left column */}
        <div
          className="grid grid-cols-[1fr_2.2fr] gap-10"
          style={{ gridAutoRows: "1fr", alignItems: "stretch" }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-6" style={{ minHeight: "100%" }}>
            {/* Avatar at top of left column */}
            <div
              className="relative flex-shrink-0 mb-2"
              onMouseEnter={() => editable && setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <div
                className="flex items-center justify-center rounded-full text-2xl font-light text-white overflow-hidden shadow-md"
                style={{
                  width: 120,
                  height: 120,
                  background: "transparent",
                  border: `3px solid ${BORDER}`,
                  cursor: editable ? "pointer" : "default",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              >
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultAvatarUrl;
                  }}
                />
              </div>
              {editable && isAvatarHovered && (
                <button
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-900 bg-opacity-75 text-white text-xs font-medium transition-opacity backdrop-blur-sm"
                  style={{
                    width: 120,
                    height: 120,
                    border: `3px solid ${BORDER}`,
                  }}
                >
                  Sửa ảnh
                </button>
              )}
              {editable && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              )}
            </div>

            {/* Thông tin cá nhân */}
            <SectionWrapper
              sectionKey="personalInfo"
              defaultTitle="Thông tin cá nhân"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div
                className="flex flex-col gap-3 text-sm"
                style={{ color: TEXT }}
              >
                <div className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: SECONDARY_TEXT,
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <InlineText
                    path={["personal", "phone"]}
                    value={data.personal.phone || ""}
                    placeholder="0123456789"
                    editable={editable}
                    onChangeText={onChangeText}
                    onFocusField={handleFocusField}
                    onBlurField={handleBlurField}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: SECONDARY_TEXT,
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <InlineText
                    path={["personal", "email"]}
                    value={data.personal.email}
                    placeholder="email@example.com"
                    editable={editable}
                    onChangeText={onChangeText}
                    onFocusField={handleFocusField}
                    onBlurField={handleBlurField}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: SECONDARY_TEXT,
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  <InlineText
                    path={["personal", "website"]}
                    value={(data.personal as any).website || ""}
                    placeholder="Website/Portfolio"
                    editable={editable}
                    onChangeText={onChangeText}
                    onFocusField={handleFocusField}
                    onBlurField={handleBlurField}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: SECONDARY_TEXT,
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <InlineText
                    path={["personal", "address"]}
                    value={data.personal.address || ""}
                    placeholder="Địa chỉ"
                    editable={editable}
                    onChangeText={onChangeText}
                    onFocusField={handleFocusField}
                    onBlurField={handleBlurField}
                    className="flex-1"
                  />
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper
              sectionKey="education"
              defaultTitle="Học vấn"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-4">
                {(data.education.length > 0 ? data.education : [{} as any]).map(
                  (edu: any, idx) => {
                    const isActive = isItemActive("education", idx);
                    return (
                      <div
                        key={`edu-${idx}`}
                        className="relative"
                        onMouseEnter={() =>
                          editable && setHoveredItem(`education.${idx}`)
                        }
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <ItemControls
                          section="education"
                          index={idx}
                          totalItems={data.education.length}
                          editable={editable}
                          onDeleteItem={onDeleteItem}
                          onAddItem={onAddItem}
                          onMoveItemUp={onMoveItemUp}
                          onMoveItemDown={onMoveItemDown}
                          show={isActive}
                        />
                        <div
                          className={`text-sm ${
                            isActive && editable
                              ? "border border-dashed rounded-lg p-3"
                              : "border border-transparent"
                          } transition-all duration-200 ease-in-out`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            borderColor:
                              isActive && editable ? BORDER : "transparent",
                            backgroundColor:
                              isActive && editable ? LIGHT_BG : "transparent",
                          }}
                        >
                          <div
                            className="font-semibold mb-1.5"
                            style={{ color: TEXT }}
                          >
                            <InlineText
                              path={["education", idx, "school"]}
                              value={edu.school || ""}
                              placeholder="Trường"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </div>
                          <div
                            className="mb-1.5 text-xs flex items-center gap-2"
                            style={{ color: SECONDARY_TEXT }}
                          >
                            <span
                              className="inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <InlineText
                                path={["education", idx, "startDate"]}
                                value={edu.startDate || ""}
                                placeholder="YYYY"
                                editable={editable}
                                onChangeText={onChangeText}
                                onFocusField={handleFocusField}
                                onBlurField={handleBlurField}
                              />
                            </span>
                            <span>—</span>
                            <span
                              className="inline-block"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <InlineText
                                path={["education", idx, "endDate"]}
                                value={edu.endDate || ""}
                                placeholder="YYYY"
                                editable={editable}
                                onChangeText={onChangeText}
                                onFocusField={handleFocusField}
                                onBlurField={handleBlurField}
                              />
                            </span>
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: SECONDARY_TEXT }}
                          >
                            <InlineText
                              path={["education", idx, "degree"]}
                              value={edu.degree || ""}
                              placeholder="Chuyên ngành"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </SectionWrapper>

            {!hiddenSections.has("skills") && (
              <SectionWrapper
                sectionKey="skills"
                defaultTitle="Kỹ năng"
                editable={editable}
                onAddItem={onAddItem}
                onUpdateSectionTitle={onUpdateSectionTitle}
                getSectionTitle={getSectionTitle}
              >
                <div className="flex flex-col gap-2.5">
                  {(data.skills.length > 0 ? data.skills : [""]).map(
                    (skill, idx) => {
                      const isActive = isItemActive("skills", idx);
                      return (
                        <div
                          key={idx}
                          className="relative"
                          onMouseEnter={() =>
                            editable && setHoveredItem(`skills.${idx}`)
                          }
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <ItemControls
                            section="skills"
                            index={idx}
                            totalItems={data.skills.length}
                            editable={editable}
                            onDeleteItem={onDeleteItem}
                            onAddItem={onAddItem}
                            onMoveItemUp={onMoveItemUp}
                            onMoveItemDown={onMoveItemDown}
                            show={isActive}
                          />
                          <div
                            className={`text-sm ${
                              isActive && editable
                                ? "border border-dashed rounded-lg p-2.5"
                                : "border border-transparent"
                            } transition-all duration-200 ease-in-out`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              borderColor:
                                isActive && editable ? BORDER : "transparent",
                              backgroundColor:
                                isActive && editable ? LIGHT_BG : "transparent",
                            }}
                          >
                            <InlineText
                              path={["skills", idx]}
                              value={skill}
                              placeholder="Kỹ năng"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </SectionWrapper>
            )}

            {!hiddenSections.has("certifications") && (
              <div
                className="relative"
                onMouseEnter={() =>
                  editable && setHoveredSection("certifications")
                }
                onMouseLeave={() => setHoveredSection(null)}
              >
                {hoveredSection === "certifications" && editable && (
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHiddenSections((prev) =>
                          new Set(prev).add("certifications")
                        );
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded border-none transition-colors"
                      style={{ backgroundColor: "#ef4444", color: "white" }}
                      title="Xóa mục này"
                    >
                      Xóa mục này
                    </button>
                  </div>
                )}
                <div
                  className={`${
                    hoveredSection === "certifications" && editable
                      ? "border border-dashed rounded p-3"
                      : "border border-transparent"
                  } transition-all duration-200 ease-in-out`}
                  style={{
                    borderColor:
                      hoveredSection === "certifications" && editable
                        ? BORDER
                        : "transparent",
                  }}
                >
                  <SectionWrapper
                    sectionKey="certifications"
                    defaultTitle="Chứng chỉ"
                    editable={editable}
                    onAddItem={onAddItem}
                    onUpdateSectionTitle={onUpdateSectionTitle}
                    getSectionTitle={getSectionTitle}
                  >
                    <div className="flex flex-col gap-2">
                      {(data.certifications && data.certifications.length > 0
                        ? data.certifications
                        : [{} as any]
                      ).map((cert: any, idx) => {
                        const isActive = isItemActive("certifications", idx);
                        return (
                          <div
                            key={`cert-${idx}`}
                            className="relative"
                            onMouseEnter={() =>
                              editable &&
                              setHoveredItem(`certifications.${idx}`)
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <ItemControls
                              section="certifications"
                              index={idx}
                              totalItems={(data.certifications || []).length}
                              editable={editable}
                              onDeleteItem={onDeleteItem}
                              onAddItem={onAddItem}
                              onMoveItemUp={onMoveItemUp}
                              onMoveItemDown={onMoveItemDown}
                              show={isActive}
                            />
                            <div
                              className={`text-sm ${
                                isActive && editable
                                  ? "border border-dashed rounded-lg p-3"
                                  : "border border-transparent"
                              } transition-all duration-200 ease-in-out`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderColor:
                                  isActive && editable ? BORDER : "transparent",
                                backgroundColor:
                                  isActive && editable
                                    ? LIGHT_BG
                                    : "transparent",
                              }}
                            >
                              <div
                                className="text-xs mb-1.5 flex items-center gap-2"
                                style={{ color: SECONDARY_TEXT }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <InlineText
                                  path={["certifications", idx, "year"]}
                                  value={cert.year || ""}
                                  placeholder="Năm"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div
                                className="font-semibold mb-1"
                                style={{ color: TEXT }}
                              >
                                <InlineText
                                  path={["certifications", idx, "name"]}
                                  value={cert.name || ""}
                                  placeholder="Tên chứng chỉ"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: SECONDARY_TEXT }}
                              >
                                <InlineText
                                  path={["certifications", idx, "issuer"]}
                                  value={cert.issuer || ""}
                                  placeholder="Đơn vị cấp"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionWrapper>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6" style={{ minHeight: "100%" }}>
            {/* Name and Job Title at top of right column */}
            <div className="mb-1 pb-4 border-b" style={{ borderColor: BORDER }}>
              <InlineText
                path={["personal", "name"]}
                value={data.personal.name}
                placeholder="Họ và tên"
                editable={editable}
                onChangeText={onChangeText}
                onFocusField={handleFocusField}
                onBlurField={handleBlurField}
                className="text-3xl font-bold mb-2"
                style={{ color: TEXT, letterSpacing: "-0.02em" }}
                block
              />
              <InlineText
                path={["personal", "jobTitle"]}
                value={(data.personal as any).jobTitle || ""}
                placeholder="Vị trí công việc"
                editable={editable}
                onChangeText={onChangeText}
                onFocusField={handleFocusField}
                onBlurField={handleBlurField}
                className="text-base font-medium"
                style={{ color: ACCENT }}
                block
              />
            </div>

            <SectionWrapper
              sectionKey="summary"
              defaultTitle="Mục tiêu nghề nghiệp"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <InlineText
                path={["personal", "summary"]}
                value={data.personal.summary || ""}
                placeholder="Trình bày mục tiêu nghề nghiệp..."
                editable={editable}
                onChangeText={onChangeText}
                onFocusField={handleFocusField}
                onBlurField={handleBlurField}
                block
                className="text-sm leading-relaxed"
                style={{ color: TEXT, lineHeight: 1.7 }}
              />
            </SectionWrapper>

            <SectionWrapper
              sectionKey="experience"
              defaultTitle="Kinh nghiệm làm việc"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-5 flex-1">
                {(data.experience.length > 0
                  ? data.experience
                  : [{} as any]
                ).map((exp: any, idx) => {
                  const isActive = isItemActive("experience", idx);
                  return (
                    <div
                      key={`exp-${idx}`}
                      className="relative"
                      onMouseEnter={() =>
                        editable && setHoveredItem(`experience.${idx}`)
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <ItemControls
                        section="experience"
                        index={idx}
                        totalItems={data.experience.length}
                        editable={editable}
                        onDeleteItem={onDeleteItem}
                        onAddItem={onAddItem}
                        onMoveItemUp={onMoveItemUp}
                        onMoveItemDown={onMoveItemDown}
                        show={isActive}
                      />
                      <div
                        className={`text-sm ${
                          isActive && editable
                            ? "border border-dashed rounded-lg p-4"
                            : "border border-transparent"
                        } transition-all duration-200 ease-in-out`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          borderColor:
                            isActive && editable ? BORDER : "transparent",
                          backgroundColor:
                            isActive && editable ? LIGHT_BG : "transparent",
                        }}
                      >
                        <div
                          className="font-semibold mb-1.5 text-base"
                          style={{ color: TEXT }}
                        >
                          <InlineText
                            path={["experience", idx, "company"]}
                            value={exp.company || ""}
                            placeholder="Công ty"
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                          />
                        </div>
                        <div
                          className="mb-2 font-medium"
                          style={{ color: ACCENT }}
                        >
                          <InlineText
                            path={["experience", idx, "role"]}
                            value={exp.role || ""}
                            placeholder="Vị trí"
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                          />
                        </div>
                        <div
                          className="text-xs mb-3 flex items-center gap-2"
                          style={{ color: SECONDARY_TEXT }}
                        >
                          <span
                            className="inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <InlineText
                              path={["experience", idx, "startDate"]}
                              value={exp.startDate || ""}
                              placeholder="YYYY"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </span>
                          <span>—</span>
                          <span
                            className="inline-block"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <InlineText
                              path={["experience", idx, "endDate"]}
                              value={exp.endDate || ""}
                              placeholder="Nay"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </span>
                        </div>
                        <div
                          className="text-sm leading-relaxed"
                          style={{ color: TEXT, lineHeight: 1.7 }}
                        >
                          <InlineText
                            path={["experience", idx, "description"]}
                            value={exp.description || ""}
                            placeholder="Mô tả công việc..."
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                            block
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionWrapper>

            {/* Activities section - if exists in data */}
            {(data as any).activities &&
              (data as any).activities.length > 0 && (
                <SectionWrapper
                  sectionKey="activities"
                  defaultTitle="Hoạt động"
                  editable={editable}
                  onAddItem={onAddItem}
                  onUpdateSectionTitle={onUpdateSectionTitle}
                  getSectionTitle={getSectionTitle}
                >
                  <div className="flex flex-col gap-3">
                    {((data as any).activities || []).map(
                      (activity: any, idx: number) => {
                        const isActive = isItemActive("activities", idx);
                        return (
                          <div
                            key={`activity-${idx}`}
                            className="relative"
                            onMouseEnter={() =>
                              editable && setHoveredItem(`activities.${idx}`)
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <ItemControls
                              section={"activities" as any}
                              index={idx}
                              totalItems={
                                ((data as any).activities || []).length
                              }
                              editable={editable}
                              onDeleteItem={onDeleteItem}
                              onAddItem={onAddItem}
                              onMoveItemUp={onMoveItemUp}
                              onMoveItemDown={onMoveItemDown}
                              show={isActive}
                            />
                            <div
                              className={`text-sm ${
                                isActive && editable
                                  ? "border border-dashed rounded-lg p-4"
                                  : "border border-transparent"
                              } transition-all duration-200 ease-in-out`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderColor:
                                  isActive && editable ? BORDER : "transparent",
                                backgroundColor:
                                  isActive && editable
                                    ? LIGHT_BG
                                    : "transparent",
                              }}
                            >
                              <div
                                className="font-semibold mb-1.5 text-base"
                                style={{ color: TEXT }}
                              >
                                <InlineText
                                  path={["activities", idx, "organization"]}
                                  value={activity.organization || ""}
                                  placeholder="Tổ chức"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div
                                className="mb-2 font-medium"
                                style={{ color: ACCENT }}
                              >
                                <InlineText
                                  path={["activities", idx, "role"]}
                                  value={activity.role || ""}
                                  placeholder="Vai trò"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div
                                className="text-xs mb-3 flex items-center gap-2"
                                style={{ color: SECONDARY_TEXT }}
                              >
                                <span
                                  className="inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  <InlineText
                                    path={["activities", idx, "startDate"]}
                                    value={activity.startDate || ""}
                                    placeholder="YYYY"
                                    editable={editable}
                                    onChangeText={onChangeText}
                                    onFocusField={handleFocusField}
                                    onBlurField={handleBlurField}
                                  />
                                </span>
                                <span>—</span>
                                <span
                                  className="inline-block"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <InlineText
                                    path={["activities", idx, "endDate"]}
                                    value={activity.endDate || ""}
                                    placeholder="YYYY"
                                    editable={editable}
                                    onChangeText={onChangeText}
                                    onFocusField={handleFocusField}
                                    onBlurField={handleBlurField}
                                  />
                                </span>
                              </div>
                              <div
                                className="text-sm leading-relaxed"
                                style={{ color: TEXT, lineHeight: 1.7 }}
                              >
                                <InlineText
                                  path={["activities", idx, "description"]}
                                  value={activity.description || ""}
                                  placeholder="Mô tả hoạt động..."
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                  block
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </SectionWrapper>
              )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-12 pt-6 text-center text-xs border-t"
          style={{ color: SECONDARY_TEXT, borderColor: BORDER }}
        >
          © InternBrigde
        </div>
      </div>
    </div>
  );
}
