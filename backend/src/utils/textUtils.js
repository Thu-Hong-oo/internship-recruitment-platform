/**
 * Text utility functions for Vietnamese text processing
 */

/**
 * Remove Vietnamese diacritics (accents)
 * Converts: "Đà Nẵng" -> "Da Nang"
 * @param {string} text - Text with diacritics
 * @returns {string} Text without diacritics
 */
function removeVietnameseTones(text) {
  if (!text) return '';

  // Normalize and remove combining diacritics
  let result = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace Vietnamese special characters
  const vietnameseMap = {
    đ: 'd',
    Đ: 'D',
    ð: 'd',
    Ð: 'D',
  };

  result = result.replace(/[đĐðÐ]/g, char => vietnameseMap[char] || char);

  return result;
}

/**
 * Create MongoDB regex query that matches both accented and unaccented text
 * Supports flexible search: "Da Nang" matches "Đà Nẵng" and vice versa
 * @param {string} searchText - Search text (can be accented or unaccented)
 * @returns {RegExp} MongoDB regex for flexible matching
 */
function createFlexibleRegex(searchText) {
  if (!searchText) return new RegExp('', 'i');

  // First, normalize the search text to remove accents
  // This ensures "Hồ Chí Minh" becomes "Ho Chi Minh"
  const normalized = removeVietnameseTones(searchText);

  // Escape special regex characters
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create character class for Vietnamese characters
  const charMap = {
    a: '[aàáảãạăằắẳẵặâầấẩẫậ]',
    A: '[AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]',
    d: '[dđ]',
    D: '[DĐ]',
    e: '[eèéẻẽẹêềếểễệ]',
    E: '[EÈÉẺẼẸÊỀẾỂỄỆ]',
    i: '[iìíỉĩị]',
    I: '[IÌÍỈĨỊ]',
    o: '[oòóỏõọôồốổỗộơờớởỡợ]',
    O: '[OÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]',
    u: '[uùúủũụưừứửữự]',
    U: '[UÙÚỦŨỤƯỪỨỬỮỰ]',
    y: '[yỳýỷỹỵ]',
    Y: '[YỲÝỶỸỴ]',
  };

  // Replace each character with its character class
  let pattern = escaped;
  for (const [base, charClass] of Object.entries(charMap)) {
    pattern = pattern.replace(new RegExp(base, 'g'), charClass);
  }

  return new RegExp(pattern, 'i');
}

/**
 * Normalize Vietnamese text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text (lowercase, no tones)
 */
function normalizeVietnameseText(text) {
  if (!text) return '';
  return removeVietnameseTones(text).toLowerCase().trim();
}

module.exports = {
  removeVietnameseTones,
  createFlexibleRegex,
  normalizeVietnameseText,
};
