"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
};

// Templates có sẵn ở frontend
const FRONTEND_TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description:
      "Template hiện đại, chuyên nghiệp, phù hợp với hầu hết vị trí ứng tuyển.",
    // Ảnh nằm trong public/images/templates
    thumbnail: "/images/templates/modern-thumb.jpg",
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Template tối giản, tinh gọn, tập trung làm nổi bật nội dung CV.",
    thumbnail: "/images/templates/minimal-thumb.jpg",
  },
];

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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-3 text-center md:text-left">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Bộ sưu tập template CV
        </p>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Chọn template CV phù hợp phong cách của bạn
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Mỗi template được thiết kế tối ưu về bố cục, dễ đọc và dễ gây ấn
            tượng với nhà tuyển dụng. Bạn có thể thay đổi nội dung và xuất CV
            bất cứ lúc nào.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => {
          const thumbnailUrl = t.thumbnail || "/placeholder.png";

          return (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
            >
              <div className="relative w-full aspect-[3/4] bg-muted/40 overflow-hidden">
                {thumbnailUrl !== "/placeholder.png" ? (
                  <Image
                    src={thumbnailUrl}
                    alt={t.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/placeholder.png"
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Overlay gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badge trên ảnh */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {t.id === "modern"
                      ? "Phong cách hiện đại"
                      : "Phong cách tối giản"}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm md:text-base">
                      {t.name} Template
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      InternBridge · CV Builder
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary font-medium">
                    {t.id === "modern" ? "Đề xuất" : "Tối giản"}
                  </span>
                </div>

                {t.description && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                    {t.description}
                  </p>
                )}
                <button
                  onClick={() => handleUseTemplate(t.id)}
                  disabled={loading === t.id}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
