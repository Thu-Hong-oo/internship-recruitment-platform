import { useMemo, useRef, useState } from "react";
import type { CVData } from "../../lib/mocks/cvSamples";
import { templateLayouts } from "../../lib/mocks/templateLayouts";
import LivePreview from "./LivePreview";
import { usePdfExport } from "../../hooks/usePdfExport";
import { useCvEditorState } from "../../hooks/useCvEditorState";

type Props = {
  data: CVData;
  onChange: (next: CVData) => void;
  templateConfig?: {
    customization?: {
      colors?: { primary: string; secondary: string; accent: string };
      fonts?: { heading: string; body: string };
    };
    renderLayout?: {
      page: { width: number; height: number; padding: number; backgroundColor?: string };
      sections: Array<{
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        order?: number;
      }>;
    } | null;
  } | null;
};

export default function CVEditor({ data, onChange, templateConfig }: Props) {
  // Ưu tiên dùng layout từ templateConfig, fallback về templateLayouts
  const layout = useMemo(() => {
    if (templateConfig?.renderLayout) {
      // Convert renderLayout từ API sang format của templateLayouts
      return {
        page: templateConfig.renderLayout.page,
        sections: templateConfig.renderLayout.sections.map((s: any) => ({
          type: s.type,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        })),
        colors: templateConfig.customization?.colors || { primary: '#2563eb', secondary: '#64748b' },
        fonts: templateConfig.customization?.fonts || { heading: 'Inter', body: 'Inter' },
      };
    }
    return templateLayouts[data.templateId];
  }, [data.templateId, templateConfig]);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { exportElementToPdf } = usePdfExport();
  const [inlineEditing] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const state = useCvEditorState(data);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          Font: {layout.fonts.heading}/{layout.fonts.body} • Màu:{" "}
          {layout.colors.primary}
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2"
          onClick={async () => {
            setExporting(true);
            if (previewRef.current) {
              await exportElementToPdf(previewRef.current, "cv.pdf");
            }
            setExporting(false);
          }}
        >
          Xuất PDF
        </button>
      </div>
      <div>
        <LivePreview
          data={data}
          layout={layout}
          containerRef={(el) => (previewRef.current = el)}
          editable={inlineEditing && !exporting}
          onChangeText={(path, value) => {
            state.updateCvText(path, value);
            onChange(state.cvData);
          }}
          onFocusField={(fp) => state.setEditingField(fp)}
          onBlurField={() => {
            onChange(state.cvData);
            state.setEditingField(null);
          }}
          editingField={state.editingField}
        />
      </div>
    </div>
  );
}
