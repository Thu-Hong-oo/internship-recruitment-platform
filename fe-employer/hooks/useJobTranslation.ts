"use client";

import { useState } from "react";
import { translateText } from "@/lib/translationAPI";
import { getToken } from "@/lib/userStorage";

export type TranslatableField =
  | "title"
  | "description"
  | "requirements"
  | "benefits";

export const TRANSLATION_LANG_OPTIONS = [
  { value: "en", label: "Tiếng Anh" },
  { value: "vi", label: "Tiếng Việt" },
] as const;

const FIELD_LABELS: Record<TranslatableField, string> = {
  title: "tiêu đề",
  description: "mô tả",
  requirements: "yêu cầu",
  benefits: "quyền lợi",
};

export function getLanguageLabel(lang: string) {
  return (
    TRANSLATION_LANG_OPTIONS.find((option) => option.value === lang)?.label ||
    lang
  );
}

export function useJobTranslation() {
  const [translationTarget, setTranslationTarget] = useState("en");
  const [translatingField, setTranslatingField] =
    useState<TranslatableField | null>(null);
  const [translationMessage, setTranslationMessage] = useState<string | null>(
    null
  );

  const translateField = async (
    field: TranslatableField,
    text: string,
    onApply: (value: string) => void
  ) => {
    if (!text?.trim()) {
      setTranslationMessage("Không có nội dung để dịch");
      return;
    }

    const token = getToken();
    if (!token) {
      setTranslationMessage("Vui lòng đăng nhập để sử dụng chức năng dịch");
      return;
    }

    try {
      setTranslatingField(field);
      setTranslationMessage(null);

      const result = await translateText(
        {
          text,
          targetLang: translationTarget,
          sourceLang: "auto",
          format: "text",
        },
        token
      );

      onApply(result.translatedText);
      setTranslationMessage(
        `Đã dịch ${FIELD_LABELS[field]} sang ${getLanguageLabel(
          translationTarget
        )}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể dịch nội dung";
      setTranslationMessage(message);
    } finally {
      setTranslatingField(null);
    }
  };

  return {
    translationTarget,
    setTranslationTarget,
    translatingField,
    translationMessage,
    translateField,
  };
}









