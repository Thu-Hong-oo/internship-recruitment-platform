export type LayoutSection =
  | { type: "personal"; x: number; y: number; width: number; height: number }
  | { type: "experience"; x: number; y: number; width: number; height: number }
  | { type: "education"; x: number; y: number; width: number; height: number }
  | { type: "skills"; x: number; y: number; width: number; height: number }
  | { type: "languages"; x: number; y: number; width: number; height: number }
  | { type: "certifications"; x: number; y: number; width: number; height: number }
  | { type: "projects"; x: number; y: number; width: number; height: number }
  | { type: "social"; x: number; y: number; width: number; height: number };

export type TemplateLayout = {
  sections: LayoutSection[];
  colors: { primary: string; secondary: string };
  fonts: { heading: string; body: string };
  page: { width: number; height: number; padding: number; backgroundColor?: string };
};

export const templateLayouts: Record<number, TemplateLayout> = {
  // Template 1: Pink Poppins theme
  1: {
    sections: [
      { type: "personal", x: 48, y: 48, width: 520, height: 140 },
      { type: "experience", x: 48, y: 210, width: 520, height: 380 },
      { type: "education", x: 48, y: 604, width: 520, height: 180 },
      { type: "projects", x: 48, y: 802, width: 520, height: 230 },
      { type: "languages", x: 596, y: 210, width: 150, height: 180 },
      { type: "skills", x: 596, y: 404, width: 150, height: 190 },
      { type: "certifications", x: 596, y: 606, width: 150, height: 220 },
      { type: "social", x: 596, y: 840, width: 150, height: 190 },
    ],
    colors: { primary: "#ff6b9d", secondary: "#2D3E50" },
    fonts: { heading: "Poppins", body: "Poppins" },
    page: { width: 794, height: 1123, padding: 24 },
  },
  // Template 2: Playfair/Inter gold-teal theme
  2: {
    sections: [
      { type: "personal", x: 48, y: 48, width: 520, height: 120 },
      { type: "experience", x: 48, y: 188, width: 520, height: 380 },
      { type: "education", x: 48, y: 584, width: 520, height: 180 },
      { type: "projects", x: 48, y: 780, width: 520, height: 240 },
      { type: "languages", x: 596, y: 188, width: 150, height: 180 },
      { type: "skills", x: 596, y: 384, width: 150, height: 190 },
      { type: "certifications", x: 596, y: 582, width: 150, height: 220 },
      { type: "social", x: 596, y: 814, width: 150, height: 190 },
    ],
    colors: { primary: "#D4A574", secondary: "#2D3E50" },
    fonts: { heading: "Playfair Display", body: "Inter" },
    page: { width: 794, height: 1123, padding: 24 },
  },
};


