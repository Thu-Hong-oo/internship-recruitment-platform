"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type TranslatePayload = {
  text: string;
  targetLang: string;
  sourceLang?: string;
  format?: "text" | "html";
};

export type TranslationResult = {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  metadata?: Record<string, any>;
};

export type TranslationAPIResponse = {
  success: boolean;
  message?: string;
  data?: TranslationResult;
  error?: string;
};

export async function translateText(
  payload: TranslatePayload,
  token: string
): Promise<TranslationResult> {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as TranslationAPIResponse;

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || data.error || "Không thể dịch nội dung");
  }

  return data.data;
}


