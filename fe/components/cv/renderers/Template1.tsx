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

const ACCENT = "#b71c1c"; // Reddish-brown accent color
const TEXT = "#333333"; // Dark gray text
const BORDER = "#d4d4d4"; // Gray border/separator

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
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-sm font-bold border-none outline-none bg-transparent"
            style={{ color: ACCENT, minWidth: 100 }}
            autoFocus
          />
        ) : (
          <div
            className="text-sm font-bold cursor-pointer"
            style={{ color: ACCENT }}
            onClick={handleTitleClick}
            title={editable ? "Click to edit title" : undefined}
          >
            {title}
          </div>
        )}
        <div className="flex-1 h-px" style={{ backgroundColor: ACCENT }} />
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
      <div className="text-sm" style={{ color: TEXT }}>
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

  // Sections that should show "Thêm" instead of "Xóa"
  const showAddButton = [
    "education",
    "experience",
    "projects",
    "skills",
    "hobbies",
    "certifications",
    "awards",
  ].includes(section as string);

  // Sections that allow deletion even with 1 item
  const allowDeleteWithOneItem = [
    "hobbies",
    "certifications",
    "awards",
  ].includes(section as string);

  return (
    <div className="flex items-center gap-1 mb-1">
      {/* Drag handle - 4 directional arrows */}
      <button
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-move"
        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
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
      {/* Move up button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveItemUp?.(section, index);
        }}
        disabled={!canMoveUp}
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
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
      {/* Move down button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveItemDown?.(section, index);
        }}
        disabled={!canMoveDown}
        className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
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
      {/* Add or Delete button */}
      {showAddButton ? (
        <>
          {/* Always show Add button for sections with showAddButton */}
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
          {/* Show Delete button when there are 2 or more items, or if section allows deletion with 1 item */}
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

export default function Template1Renderer({
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const personalRaw =
    (data as any).personal ||
    (data as any).personalInfo ||
    (data as any).profile ||
    {};
  const personal = {
    name:
      personalRaw.name || personalRaw.fullName || personalRaw.fullname || "",
    jobTitle:
      personalRaw.jobTitle ||
      personalRaw.position ||
      personalRaw.title ||
      personalRaw.targetRole ||
      "",
    summary:
      personalRaw.summary ||
      personalRaw.bio ||
      personalRaw.objective ||
      (data as any).summary ||
      "",
    phone: personalRaw.phone || "",
    email: personalRaw.email || "",
    website:
      personalRaw.website ||
      personalRaw.portfolio ||
      personalRaw.personalWebsite ||
      personalRaw.linkedin ||
      personalRaw.github ||
      personalRaw.link ||
      "",
    address: personalRaw.address || "",
    avatar: personalRaw.avatar,
  };

  // Normalize skills (support technical/soft/languages objects)
  const skillsNormalized: string[] = (() => {
    const rawBase = (data as any).skills;
    const raw = Array.isArray(rawBase) ? rawBase : rawBase ? [rawBase] : [];
    const names: string[] = [];
    raw.forEach((item: any) => {
      if (typeof item === "string") {
        names.push(item);
      } else if (item?.name) {
        names.push(item.name);
      } else {
        if (Array.isArray(item?.technical)) {
          item.technical.forEach((t: any) => t?.name && names.push(t.name));
        }
        if (Array.isArray(item?.soft)) {
          item.soft.forEach((t: any) => t?.name && names.push(t.name));
        }
        if (Array.isArray(item?.languages)) {
          item.languages.forEach((t: any) => t?.name && names.push(t.name));
        }
      }
    });
    return names;
  })();

  const initials =
    personal.name
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NV";

  // State for preview avatar (temporary preview before upload completes)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Get avatar URL or use default
  const defaultAvatarUrl = "/images/avatar_trang.jpg";
  const dataAvatar = personal.avatar;
  const avatarUrl = previewAvatar || dataAvatar || defaultAvatarUrl;
  const hasCustomAvatar = !!(previewAvatar || dataAvatar);

  // Clear preview when data avatar is updated (after successful upload)
  useEffect(() => {
    if (dataAvatar && previewAvatar) {
      // If data has avatar, clear preview (upload completed)
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
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatar(previewUrl);

      // Call callback to handle upload
      if (onAvatarChange) {
        onAvatarChange(file);
      }
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  // Track focused field to determine which item is active
  const handleFocusField = (fieldPath: string) => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // Extract item identifier from field path (e.g., "education.0.degree" -> "education.0")
    const parts = fieldPath.split(".");
    if (parts.length >= 2) {
      const section = parts[0];
      const index = parts[1];
      setFocusedItem(`${section}.${index}`);
    }
    onFocusField?.(fieldPath);
  };

  const handleBlurField = () => {
    // Use a small delay to allow focus to move to another field in the same item
    // This prevents flickering when moving between fields within the same item
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    blurTimeoutRef.current = setTimeout(() => {
      // Check if focus moved to another field in the same item
      // If activeElement is still a contentEditable, don't clear focusedItem yet
      const activeElement = document.activeElement;
      const isContentEditable = activeElement?.hasAttribute("contenteditable");

      // Only clear if we're sure focus has left all fields in this item
      if (!isContentEditable) {
        setFocusedItem(null);
      }
      blurTimeoutRef.current = null;
    }, 150);

    onBlurField?.();
  };

  // Check if an item should show controls (is focused or hovered)
  const isItemActive = (section: string, index: number) => {
    const itemKey = `${section}.${index}`;
    // Prioritize hoveredItem to ensure smooth hover experience
    // Only use focusedItem if not hovered
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
          padding: "36px 48px 48px",
          fontFamily: "Arial, sans-serif",
          color: TEXT,
        }}
      >
        {/* Header */}
        <div className="flex gap-6 items-start mb-6">
          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => editable && setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
          >
            <div
              className="flex items-center justify-center rounded-full text-3xl font-semibold text-white overflow-hidden"
              style={{
                width: 110,
                height: 110,
                background: "transparent",
                border: `4px solid ${ACCENT}`,
                cursor: editable ? "pointer" : "default",
              }}
            >
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  (e.target as HTMLImageElement).src = defaultAvatarUrl;
                }}
              />
            </div>
            {/* Edit button overlay */}
            {editable && isAvatarHovered && (
              <button
                onClick={handleAvatarClick}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-500 bg-opacity-90 text-white text-xs font-medium transition-opacity"
                style={{
                  width: 110,
                  height: 110,
                  border: `4px solid ${ACCENT}`,
                }}
              >
                Sửa ảnh
              </button>
            )}
            {/* Hidden file input */}
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
          <div className="flex flex-col flex-1">
            <InlineText
              path={["personal", "name"]}
              value={personal.name}
              placeholder="Họ và tên"
              editable={editable}
              onChangeText={onChangeText}
              onFocusField={handleFocusField}
              onBlurField={handleBlurField}
              className="text-2xl font-bold mb-3"
              style={{ color: ACCENT }}
              block
            />
            {/* Contact info in 2 columns */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">📞</span>
                <InlineText
                  path={["personal", "phone"]}
                  value={personal.phone || ""}
                  placeholder="0123456789"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">👤</span>
                <InlineText
                  path={["personal", "jobTitle"]}
                  value={personal.jobTitle || ""}
                  placeholder="Vị trí công việc"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">📍</span>
                <InlineText
                  path={["personal", "address"]}
                  value={personal.address || ""}
                  placeholder="Địa chỉ"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">🔗</span>
                <InlineText
                  path={["personal", "website"]}
                  value={(data.personal as any).website || ""}
                  placeholder="Website/Portfolio"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">✉️</span>
                <InlineText
                  path={["personal", "email"]}
                  value={personal.email}
                  placeholder="email@example.com"
                  editable={editable}
                  onChangeText={onChangeText}
                  onFocusField={handleFocusField}
                  onBlurField={handleBlurField}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content - 2 columns */}
        <div
          className="grid grid-cols-[2fr_1fr] gap-8"
          style={{ gridAutoRows: "1fr", alignItems: "stretch" }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-4" style={{ minHeight: "100%" }}>
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
                value={personal.summary || ""}
                placeholder="Trình bày mục tiêu nghề nghiệp..."
                editable={editable}
                onChangeText={onChangeText}
                onFocusField={handleFocusField}
                onBlurField={handleBlurField}
                block
                className="text-sm leading-6"
              />
            </SectionWrapper>

            <SectionWrapper
              sectionKey="education"
              defaultTitle="Học vấn"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-2">
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
                              ? "border-2 border-dashed rounded p-2 mb-2"
                              : "border-2 border-dashed border-transparent"
                          } transition-all duration-200 ease-in-out`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            borderColor:
                              isActive && editable ? "#d4d4d4" : "transparent",
                          }}
                        >
                          <div className="font-semibold mb-1">
                            <InlineText
                              path={["education", idx, "degree"]}
                              value={edu.degree || ""}
                              placeholder="Bằng cấp"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </div>
                          <div className="text-gray-600 mb-1">
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
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span
                              className="inline-block"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
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
                            <span>-</span>
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
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </SectionWrapper>

            <SectionWrapper
              sectionKey="experience"
              defaultTitle="Kinh nghiệm làm việc"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-3 flex-1">
                {(data.experience.length > 0
                  ? data.experience
                  : [{} as any]
                ).map((exp: any, idx) => {
                  const isActive = isItemActive("experience", idx);
                  return (
                    <div
                      key={`exp-${idx}`}
                      className="relative mb-3"
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
                            ? "border-2 border-dashed rounded p-2"
                            : "border-2 border-dashed border-transparent"
                        } transition-all duration-200 ease-in-out`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          borderColor:
                            isActive && editable ? "#d4d4d4" : "transparent",
                        }}
                      >
                        <div className="font-semibold mb-1">
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
                        <div className="text-gray-600 mb-1">
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
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <span
                            className="inline-block"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <InlineText
                              path={["experience", idx, "startDate"]}
                              value={exp.startDate || ""}
                              placeholder="YYYY-MM"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </span>
                          <span>-</span>
                          <span
                            className="inline-block"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <InlineText
                              path={["experience", idx, "endDate"]}
                              value={exp.endDate || ""}
                              placeholder="YYYY-MM"
                              editable={editable}
                              onChangeText={onChangeText}
                              onFocusField={handleFocusField}
                              onBlurField={handleBlurField}
                            />
                          </span>
                        </div>
                        <div className="text-xs">
                          <InlineText
                            path={["experience", idx, "description"]}
                            value={exp.description || ""}
                            placeholder="Mô tả công việc..."
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                            block
                            style={{ color: "#4b5563" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionWrapper>

            <SectionWrapper
              sectionKey="projects"
              defaultTitle="Dự án"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-3">
                {(data.projects && data.projects.length > 0
                  ? data.projects
                  : [{} as any]
                ).map((project: any, idx) => {
                  const isActive = isItemActive("projects", idx);
                  return (
                    <div
                      key={`project-${idx}`}
                      className="relative mb-3"
                      onMouseEnter={() =>
                        editable && setHoveredItem(`projects.${idx}`)
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <ItemControls
                        section="projects"
                        index={idx}
                        totalItems={(data.projects || []).length}
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
                            ? "border-2 border-dashed rounded p-2"
                            : "border-2 border-dashed border-transparent"
                        } transition-all duration-200 ease-in-out`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          borderColor:
                            isActive && editable ? "#d4d4d4" : "transparent",
                        }}
                      >
                        <div className="font-semibold mb-1">
                          <InlineText
                            path={["projects", idx, "title"]}
                            value={project.title || ""}
                            placeholder="Tên dự án"
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                          />
                        </div>
                        <div className="text-xs">
                          <InlineText
                            path={["projects", idx, "description"]}
                            value={project.description || ""}
                            placeholder="Mô tả dự án..."
                            editable={editable}
                            onChangeText={onChangeText}
                            onFocusField={handleFocusField}
                            onBlurField={handleBlurField}
                            block
                            style={{ color: "#4b5563" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionWrapper>

            <SectionWrapper
              sectionKey="skills"
              defaultTitle="Kỹ năng"
              editable={editable}
              onAddItem={onAddItem}
              onUpdateSectionTitle={onUpdateSectionTitle}
              getSectionTitle={getSectionTitle}
            >
              <div className="flex flex-col gap-3">
                {(skillsNormalized.length > 0 ? skillsNormalized : [""]).map(
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
                          totalItems={skillsNormalized.length}
                          editable={editable}
                          onDeleteItem={onDeleteItem}
                          onAddItem={onAddItem}
                          onMoveItemUp={onMoveItemUp}
                          onMoveItemDown={onMoveItemDown}
                          show={isActive}
                        />
                        <div
                          className={`flex items-center gap-2 ${
                            isActive && editable
                              ? "border-2 border-dashed rounded p-2"
                              : "border-2 border-dashed border-transparent"
                          } transition-all duration-200 ease-in-out`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            borderColor:
                              isActive && editable ? "#d4d4d4" : "transparent",
                          }}
                        >
                          <div className="text-sm flex-1">
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
                          {idx < 3 && (
                            <div
                              className="h-2 flex-1"
                              style={{
                                backgroundColor: "#e5e5e5",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                className="h-full"
                                style={{
                                  width: "100%",
                                  backgroundColor: "#b0b0b0",
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </SectionWrapper>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4" style={{ minHeight: "100%" }}>
            {!hiddenSections.has("certifications") && (
              <div
                className="relative mb-4"
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
                      ? "border-2 border-dashed rounded p-3"
                      : "border-2 border-dashed border-transparent"
                  } transition-all duration-200 ease-in-out`}
                  style={{
                    borderColor:
                      hoveredSection === "certifications" && editable
                        ? "#d4d4d4"
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
                            className="relative mb-2"
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
                                  ? "border-2 border-dashed rounded p-2"
                                  : "border-2 border-dashed border-transparent"
                              } transition-all duration-200 ease-in-out`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderColor:
                                  isActive && editable
                                    ? "#d4d4d4"
                                    : "transparent",
                              }}
                            >
                              <div>
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
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <InlineText
                                  path={["certifications", idx, "issuer"]}
                                  value={cert.issuer || ""}
                                  placeholder="Đơn vị cấp"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                                <span>•</span>
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionWrapper>
                </div>
              </div>
            )}

            {!hiddenSections.has("awards") && (
              <div
                className="relative mb-4"
                onMouseEnter={() => editable && setHoveredSection("awards")}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {hoveredSection === "awards" && editable && (
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHiddenSections((prev) =>
                          new Set(prev).add("awards")
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
                    hoveredSection === "awards" && editable
                      ? "border-2 border-dashed rounded p-3"
                      : "border-2 border-dashed border-transparent"
                  } transition-all duration-200 ease-in-out`}
                  style={{
                    borderColor:
                      hoveredSection === "awards" && editable
                        ? "#d4d4d4"
                        : "transparent",
                  }}
                >
                  {/* <SectionWrapper
                    sectionKey="awards"
                    defaultTitle="Danh hiệu và giải thưởng"
                    editable={editable}
                    onAddItem={onAddItem}
                    onUpdateSectionTitle={onUpdateSectionTitle}
                    getSectionTitle={getSectionTitle}
                  >
                    <div className="flex flex-col gap-3">
                      {((data as any).awards && (data as any).awards.length > 0
                        ? (data as any).awards
                        : [{} as any]
                      ).map((award: any, idx: number) => {
                        const isActive = isItemActive("awards", idx);
                        return (
                          <div
                            key={`award-${idx}`}
                            className="relative mb-3"
                            onMouseEnter={() =>
                              editable && setHoveredItem(`awards.${idx}`)
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <ItemControls
                              section={"awards" as any}
                              index={idx}
                              totalItems={((data as any).awards || []).length}
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
                                  ? "border-2 border-dashed rounded p-2"
                                  : "border-2 border-dashed border-transparent"
                              } transition-all duration-200 ease-in-out`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderColor:
                                  isActive && editable
                                    ? "#d4d4d4"
                                    : "transparent",
                              }}
                            >
                              <div className="font-semibold mb-1">
                                <InlineText
                                  path={["awards", idx, "title"]}
                                  value={award.title || ""}
                                  placeholder="Tên danh hiệu/giải thưởng"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div className="text-gray-600 mb-1">
                                <InlineText
                                  path={["awards", idx, "issuer"]}
                                  value={award.issuer || ""}
                                  placeholder="Đơn vị trao giải"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <InlineText
                                  path={["awards", idx, "year"]}
                                  value={award.year || ""}
                                  placeholder="Năm"
                                  editable={editable}
                                  onChangeText={onChangeText}
                                  onFocusField={handleFocusField}
                                  onBlurField={handleBlurField}
                                />
                              </div>
                              {(award.description || editable) && (
                                <div className="text-xs">
                                  <InlineText
                                    path={["awards", idx, "description"]}
                                    value={award.description || ""}
                                    placeholder="Mô tả..."
                                    editable={editable}
                                    onChangeText={onChangeText}
                                    onFocusField={handleFocusField}
                                    onBlurField={handleBlurField}
                                    block
                                    className="text-sm leading-6"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionWrapper> */}
                </div>
              </div>
            )}

            {!hiddenSections.has("hobbies") && (
              <div
                className="relative mb-4"
                onMouseEnter={() => editable && setHoveredSection("hobbies")}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {hoveredSection === "hobbies" && editable && (
                  <div className="flex items-center gap-1 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHiddenSections((prev) =>
                          new Set(prev).add("hobbies")
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
                    hoveredSection === "hobbies" && editable
                      ? "border-2 border-dashed rounded p-3"
                      : "border-2 border-dashed border-transparent"
                  } transition-all duration-200 ease-in-out`}
                  style={{
                    borderColor:
                      hoveredSection === "hobbies" && editable
                        ? "#d4d4d4"
                        : "transparent",
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-right text-xs text-gray-400">
          © InternBrigde
        </div>
      </div>
    </div>
  );
}
