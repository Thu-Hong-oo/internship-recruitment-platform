// Directly use provinces.open-api.vn
// Docs/examples: `https://provinces.open-api.vn/api/p/` and `https://provinces.open-api.vn/api/p/{code}?depth=2` and `https://provinces.open-api.vn/api/d/{code}?depth=2`

export const getCities = async (): Promise<
  { value: string; label: string }[]
> => {
  const res = await fetch("https://provinces.open-api.vn/api/p/");
  if (!res.ok) throw new Error("Failed to load provinces");
  const provinces = await res.json();
  return (provinces || []).map((p: any) => ({
    value: String(p.code),
    label: p.name,
  }));
};

export const getDistricts = async (
  provinceCode: string
): Promise<{ value: string; label: string }[]> => {
  if (!provinceCode) return [];
  const res = await fetch(
    `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
  );
  if (!res.ok) throw new Error("Failed to load districts");
  const data = await res.json();
  return (data?.districts || []).map((d: any) => ({
    value: String(d.code),
    label: d.name,
  }));
};

export const getWards = async (
  districtCode: string
): Promise<{ value: string; label: string }[]> => {
  if (!districtCode) return [];
  const res = await fetch(
    `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
  );
  if (!res.ok) throw new Error("Failed to load wards");
  const data = await res.json();
  return (data?.wards || []).map((w: any) => ({
    value: String(w.code),
    label: w.name,
  }));
};
