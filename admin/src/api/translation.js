import axiosClient from "./axiosClient";

/**
 * Translation API for admin
 */
export const translationAPI = {
  /**
   * Translate text from one language to another
   * @param {Object} payload - Translation payload
   * @param {string} payload.text - Text to translate
   * @param {string} payload.targetLang - Target language code (e.g., "en", "vi")
   * @param {string} [payload.sourceLang] - Source language code (optional, auto-detect if not provided)
   * @param {string} [payload.format] - Format: "text" or "html" (default: "text")
   * @returns {Promise<Object>} Translation result
   */
  translateText: async ({ text, targetLang, sourceLang, format = "text" }) => {
    try {
      const response = await axiosClient.post("/translate", {
        text,
        targetLang,
        sourceLang,
        format,
      });

      return {
        success: Boolean(response?.success),
        data: response?.data ?? null,
        message: response?.message,
        error: response?.error,
        raw: response,
      };
    } catch (error) {
      // Xử lý lỗi từ API
      if (error.response?.data) {
        return {
          success: false,
          error:
            error.response.data.error ||
            error.response.data.message ||
            "Không thể dịch nội dung",
          raw: error.response.data,
        };
      }

      // Lỗi mạng hoặc lỗi khác
      return {
        success: false,
        error: error.message || "Có lỗi xảy ra khi dịch",
        raw: error,
      };
    }
  },
};

export default translationAPI;
