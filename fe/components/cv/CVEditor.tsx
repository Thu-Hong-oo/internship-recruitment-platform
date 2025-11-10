import { useMemo, useRef, useState } from "react";
import type { CVData } from "../../lib/mocks/cvSamples";
import { templateLayouts } from "../../lib/mocks/templateLayouts";
import LivePreview from "./LivePreview";
import { usePdfExport } from "../../hooks/usePdfExport";
import { useCvEditorState } from "../../hooks/useCvEditorState";

type Props = {
  data: CVData;
  onChange: (next: CVData) => void;
};

export default function CVEditor({ data, onChange }: Props) {
  const layout = useMemo(
    () => templateLayouts[data.templateId],
    [data.templateId]
  );
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
