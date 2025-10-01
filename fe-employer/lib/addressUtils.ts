export type AddressOption = { value: string; label: string };

// Normalize Vietnamese administrative names for loose string matching
export const normalizeVietnameseName = (name?: string): string => {
  if (!name) return "";
  const lower = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return lower
    .replace(/^(thanh pho|tp\.?|tinh)\s+/g, "")
    .replace(
      /^(quan|qu\.\s*|huyen|h\.\s*|thi xa|tx\.?|tp\.?|thanh pho)\s+/g,
      ""
    )
    .replace(/^(phuong|p\.?|xa|x\.?|thi tran)\s+/g, "")
    .trim();
};

// Find an option by label using loose Vietnamese normalization
export const findOptionByLabelLoose = (
  options: AddressOption[],
  targetName?: string
): AddressOption | undefined => {
  if (!targetName) return undefined;
  const normalizedTarget = normalizeVietnameseName(targetName);
  return options.find(
    (opt) => normalizeVietnameseName(opt.label) === normalizedTarget
  );
};
