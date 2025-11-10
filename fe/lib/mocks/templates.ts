export type Template = {
  id: number;
  name: string;
  thumbnail: string;
};

export const templates: Template[] = [
  { id: 1, name: "Professional Blue", thumbnail: "/templates/pro_blue.png" },
  { id: 2, name: "Creative Minimal", thumbnail: "/templates/creative_minimal.png" },
];

export function getTemplateById(id: number): Template | undefined {
  return templates.find((t) => t.id === id);
}


