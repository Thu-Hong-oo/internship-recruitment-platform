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
      
      // Navigate to the parent of the target, creating objects/arrays as needed
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (cursor[key] === undefined || cursor[key] === null) {
          // Determine if next key is a number (array index) or string (object key)
          const nextKey = path[i + 1];
          if (typeof nextKey === 'number') {
            cursor[key] = [];
          } else {
            cursor[key] = {};
          }
        }
        cursor = cursor[key];
      }
      
      // Set the final value
      const finalKey = path[path.length - 1];
      cursor[finalKey] = value;
      
      return clone as CVData;
    });
  }, []);

  // Add item to a section array
  const addItem = useCallback((section: keyof CVData, index?: number) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      let array = clone[section] as any[];
      
      // Handle special sections that might not exist yet
      if (!array) {
        if (section === 'references' || (section as string) === 'references') {
          clone.references = [];
          array = clone.references;
        } else if (section === 'awards' || (section as string) === 'awards') {
          clone.awards = [];
          array = clone.awards;
        } else {
          return clone;
        }
      }
      
      if (!Array.isArray(array)) return clone;
      
      // Create empty item based on section type
      let newItem: any = {};
      if (section === 'experience') {
        newItem = { company: '', role: '', startDate: '', endDate: '', description: '' };
      } else if (section === 'education') {
        newItem = { school: '', degree: '', startDate: '', endDate: '' };
      } else if (section === 'projects') {
        newItem = { title: '', description: '' };
      } else if (section === 'certifications') {
        newItem = { name: '', issuer: '', year: '' };
      } else if (section === 'skills') {
        newItem = '';
      } else if (section === 'hobbies') {
        newItem = '';
      } else if (section === 'social') {
        newItem = { label: '', url: '' };
      } else if (section === 'languages') {
        newItem = { name: '', level: '', rating: 0 };
      } else if (section === 'references' || (section as string) === 'references') {
        newItem = { name: '', position: '', contact: '' };
      } else if (section === 'awards' || (section as string) === 'awards') {
        newItem = { title: '', issuer: '', year: '', description: '' };
      }
      
      // If index is provided, insert after the current item (index + 1)
      // Otherwise, append to the end
      if (index !== undefined && index >= 0 && index < array.length) {
        array.splice(index + 1, 0, newItem);
      } else {
        array.push(newItem);
      }
      
      return clone as CVData;
    });
  }, []);

  // Delete item from a section array
  const deleteItem = useCallback((section: keyof CVData, index: number) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const array = clone[section] as any[];
      
      if (!Array.isArray(array) || index < 0 || index >= array.length) return clone;
      
      array.splice(index, 1);
      
      return clone as CVData;
    });
  }, []);

  // Duplicate item in a section array
  const duplicateItem = useCallback((section: keyof CVData, index: number) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const array = clone[section] as any[];
      
      if (!Array.isArray(array) || index < 0 || index >= array.length) return clone;
      
      const itemToDuplicate = structuredClone ? structuredClone(array[index]) : JSON.parse(JSON.stringify(array[index]));
      array.splice(index + 1, 0, itemToDuplicate);
      
      return clone as CVData;
    });
  }, []);

  // Move item up in a section array
  const moveItemUp = useCallback((section: keyof CVData, index: number) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const array = clone[section] as any[];
      
      if (!Array.isArray(array) || index <= 0 || index >= array.length) return clone;
      
      // Swap with previous item
      [array[index - 1], array[index]] = [array[index], array[index - 1]];
      
      return clone as CVData;
    });
  }, []);

  // Move item down in a section array
  const moveItemDown = useCallback((section: keyof CVData, index: number) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      const array = clone[section] as any[];
      
      if (!Array.isArray(array) || index < 0 || index >= array.length - 1) return clone;
      
      // Swap with next item
      [array[index], array[index + 1]] = [array[index + 1], array[index]];
      
      return clone as CVData;
    });
  }, []);

  // Update section title
  const updateSectionTitle = useCallback((section: string, newTitle: string) => {
    setCvData((prev) => {
      const clone: any = structuredClone ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      if (!clone.sectionTitles) {
        clone.sectionTitles = {};
      }
      clone.sectionTitles[section] = newTitle;
      return clone as CVData;
    });
  }, []);

  // Get section title (with fallback to default)
  const getSectionTitle = useCallback((section: string, defaultTitle: string): string => {
    return cvData.sectionTitles?.[section] || defaultTitle;
  }, [cvData.sectionTitles]);

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
    addItem,
    deleteItem,
    duplicateItem,
    moveItemUp,
    moveItemDown,
    updateSectionTitle,
    getSectionTitle,
  };
}


