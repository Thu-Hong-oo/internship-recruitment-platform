/**
 * Utility functions to handle filename encoding issues with Vietnamese characters
 * Fixes common encoding problems when filenames are sent from browser to server
 */

/**
 * Decode filename that may be incorrectly encoded
 * Handles cases where UTF-8 filenames are decoded as ISO-8859-1 or vice versa
 * 
 * @param {string} filename - The potentially corrupted filename
 * @returns {string} - The correctly decoded filename
 */
function decodeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return filename || '';
  }

  try {
    // Try to detect and fix common encoding issues
    // Case 1: UTF-8 bytes interpreted as ISO-8859-1 (most common)
    // Example: "NhÃ¢n" should be "Nhân"
    if (filename.includes('Ã') || filename.includes('á»')) {
      // Try to fix by re-encoding as ISO-8859-1 then decoding as UTF-8
      try {
        const fixed = Buffer.from(filename, 'latin1').toString('utf8');
        // Check if the result looks more correct (has fewer weird characters)
        if (fixed && !fixed.includes('Ã') && !fixed.includes('á»')) {
          return fixed;
        }
      } catch (e) {
        // If that fails, continue with other methods
      }
    }

    // Case 2: Already correct UTF-8, just return as is
    // Check if it contains valid Vietnamese characters
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(filename)) {
      return filename;
    }

    // Case 3: Try URL decoding in case it was double-encoded
    try {
      const urlDecoded = decodeURIComponent(filename);
      if (urlDecoded !== filename) {
        return urlDecoded;
      }
    } catch (e) {
      // Not URL encoded, continue
    }

    // Case 4: Try to fix by treating as ISO-8859-1 and converting to UTF-8
    try {
      const buffer = Buffer.from(filename, 'latin1');
      const utf8String = buffer.toString('utf8');
      // Only return if it looks better (has Vietnamese characters)
      if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(utf8String)) {
        return utf8String;
      }
    } catch (e) {
      // Conversion failed
    }

    // If all else fails, return original
    return filename;
  } catch (error) {
    // If any error occurs, return original filename
    return filename;
  }
}

/**
 * Normalize filename by removing/replacing problematic characters
 * @param {string} filename - The filename to normalize
 * @returns {string} - Normalized filename
 */
function normalizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return filename || '';
  }

  // First decode if needed
  let decoded = decodeFilename(filename);

  // Remove or replace problematic characters for filesystem
  // Keep Vietnamese characters but remove control characters
  return decoded
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[/\\?%*:|"<>]/g, '_') // Replace filesystem-unsafe characters
    .trim();
}

module.exports = {
  decodeFilename,
  normalizeFilename,
};

