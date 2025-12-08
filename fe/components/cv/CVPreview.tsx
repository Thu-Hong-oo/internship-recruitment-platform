"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import type { CVData } from "../../lib/mocks/cvSamples";
import Template1Renderer from "./renderers/Template1";
import TemplateMinimalRenderer from "./renderers/TemplateMinimal";

type Props = {
  data: CVData;
  templateId: string; // "modern" hoặc "minimal"
};

// Kích thước CV A4 (pixels)
const CV_WIDTH = 794;
const CV_HEIGHT = 1123;

/**
 * Component preview CV nhỏ gọn để hiển thị trong gallery
 * Tự động tính scale để CV hiển thị đầy đủ trong container
 */
export default function CVPreview({ data, templateId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  // Tính toán scale dựa trên kích thước container
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Tính scale để CV vừa khít trong container
      const scaleX = containerWidth / CV_WIDTH;
      const scaleY = containerHeight / CV_HEIGHT;
      // Lấy scale nhỏ hơn để đảm bảo CV vừa khít cả width và height
      const newScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 để có padding nhỏ

      setScale(newScale);
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  const previewData = useMemo(() => {
    // Chỉ lấy một phần dữ liệu để preview nhanh hơn
    return {
      ...data,
      experience: data.experience?.slice(0, 2) || [],
      education: data.education?.slice(0, 2) || [],
      skills: data.skills?.slice(0, 5) || [],
      projects: data.projects?.slice(0, 1) || [],
    };
  }, [data]);

  const shouldUseTemplate1 = templateId === "modern";
  const shouldUseTemplateMinimal = templateId === "minimal";

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative flex items-center justify-center"
    >
      <div
        className="bg-white"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: `${CV_WIDTH}px`,
          height: `${CV_HEIGHT}px`,
        }}
      >
        {shouldUseTemplateMinimal ? (
          <TemplateMinimalRenderer
            data={previewData}
            editable={false}
            containerRef={() => {}}
            onChangeText={() => {}}
            onFocusField={() => {}}
            onBlurField={() => {}}
            onAddItem={() => {}}
            onDeleteItem={() => {}}
            onDuplicateItem={() => {}}
            onMoveItemUp={() => {}}
            onMoveItemDown={() => {}}
          />
        ) : shouldUseTemplate1 ? (
          <Template1Renderer
            data={previewData}
            editable={false}
            containerRef={() => {}}
            onChangeText={() => {}}
            onFocusField={() => {}}
            onBlurField={() => {}}
            onAddItem={() => {}}
            onDeleteItem={() => {}}
            onDuplicateItem={() => {}}
            onMoveItemUp={() => {}}
            onMoveItemDown={() => {}}
          />
        ) : null}
      </div>
    </div>
  );
}
