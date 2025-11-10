import { useState, useCallback } from "react";
import type { CVData } from "../lib/mocks/cvSamples";

export function useCvEditorState(initial: CVData) {
  const [cvData, setCvData] = useState<CVData>(initial);
  const [zoom, setZoom] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof CVData>(key: K, value: CVData[K]) => {
    setCvData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Update nested paths, e.g. ["personal","name"] or ["experience", 0, "role"]
  const updateCvText = useCallback((path: Array<string | number>, value: string) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      let cursor: any = clone;
      for (let i = 0; i < path.length - 1; i++) {
        cursor = cursor[path[i] as any];
      }
      cursor[path[path.length - 1] as any] = value;
      return clone as CVData;
    });
  }, []);

  return {
    cvData,
    setCvData,
    zoom,
    setZoom,
    selectedSection,
    setSelectedSection,
    editingField,
    setEditingField,
    updateField,
    updateCvText,
  };
}


