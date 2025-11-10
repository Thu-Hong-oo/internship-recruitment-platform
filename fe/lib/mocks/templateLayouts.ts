export type LayoutSection =
  | { type: "personal"; x: number; y: number; width: number; height: number }
  | { type: "experience"; x: number; y: number; width: number; height: number }
  | { type: "education"; x: number; y: number; width: number; height: number }
  | { type: "skills"; x: number; y: number; width: number; height: number };

export type TemplateLayout = {
  sections: LayoutSection[];
  colors: { primary: string; secondary: string };
  fonts: { heading: string; body: string };
  page: { width: number; height: number; padding: number };
};

export const templateLayouts: Record<number, TemplateLayout> = {
  1: {
    sections: [
      { type: "personal", x: 50, y: 50, width: 500, height: 80 },
      { type: "experience", x: 50, y: 150, width: 500, height: 300 },
      { type: "education", x: 50, y: 470, width: 500, height: 180 },
      { type: "skills", x: 580, y: 150, width: 180, height: 300 },
    ],
    colors: { primary: "#0d6efd", secondary: "#6c757d" },
    fonts: { heading: "Arial", body: "Helvetica" },
    page: { width: 794, height: 1123, padding: 24 }, // A4 @96dpi approx
  },
  2: {
    sections: [
      { type: "personal", x: 60, y: 60, width: 480, height: 80 },
      { type: "experience", x: 60, y: 160, width: 480, height: 320 },
      { type: "education", x: 60, y: 500, width: 480, height: 180 },
      { type: "skills", x: 560, y: 160, width: 180, height: 300 },
    ],
    colors: { primary: "#111827", secondary: "#6b7280" },
    fonts: { heading: "Inter", body: "Inter" },
    page: { width: 794, height: 1123, padding: 24 },
  },
};


