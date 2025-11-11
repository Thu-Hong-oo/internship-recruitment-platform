export type Template = {
  id: number;
  name: string;
  thumbnail: string;
};

export const templates: Template[] = [
  { id: 1, name: "Travel Pink", thumbnail: "/templates/travel_pink.png" },
  { id: 2, name: "Travel Classic", thumbnail: "/templates/travel_classic.png" },
];

export function getTemplateById(id: number): Template | undefined {
  return templates.find((t) => t.id === id);
}


