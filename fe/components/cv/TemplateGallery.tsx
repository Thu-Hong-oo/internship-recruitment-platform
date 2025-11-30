"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Templates có sẵn ở frontend
const FRONTEND_TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    description: "Template hiện đại, phù hợp với mọi ngành nghề",
    thumbnail: "/images/templates/modern-thumb.jpg",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Template đơn giản, sạch sẽ cho người mới bắt đầu",
    thumbnail: "/images/templates/minimal-thumb.jpg",
  },
];

type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
};

export default function TemplateGallery() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const templates = FRONTEND_TEMPLATES;

  const handleUseTemplate = (templateId: string) => {
    // Chỉ redirect đến trang edit, không gọi API
    // API createCVFromTemplate sẽ được gọi khi user bấm "Lưu"
    router.push(`/my-cv/new?template=${templateId}`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Chọn Template</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {templates.map((t) => {
          const thumbnailUrl =
            t.preview?.thumbnail ||
            t.thumbnail ||
            t.preview?.image ||
            "/placeholder.png";

          return (
            <div
              key={t.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full aspect-[3/4] bg-gray-50">
                {thumbnailUrl !== "/placeholder.png" ? (
                  <Image
                    src={thumbnailUrl}
                    alt={t.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/placeholder.png"
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="font-medium mb-1">{t.name}</div>
                {t.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <button
                  onClick={() => handleUseTemplate(t.id)}
                  disabled={loading === t.id}
                  className="w-full text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === t.id ? "Đang chuyển..." : "Dùng template này"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
