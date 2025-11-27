"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "../../lib/api";

type Template = {
  id: string;
  name: string;
  description: string;
  preview?: {
    thumbnail?: string;
    image?: string;
  };
  thumbnail?: string;
};

export default function TemplateGallery() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Lấy danh sách templates từ API backend
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await api.candidateCV.getTemplates();

        if (response.success && response.data?.templates) {
          setTemplates(response.data.templates);
        } else {
          console.error("Failed to load templates:", response);
          // Fallback: sử dụng danh sách rỗng hoặc mock data
          setTemplates([]);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const handleUseTemplate = async (templateId: string) => {
    try {
      setLoading(templateId);

      // Gọi API tạo CV từ template
      const response = await api.candidateCV.createCVFromTemplate(
        templateId,
        true // setAsDefault = true
      );

      if (response.success) {
        // Redirect đến trang edit CV với template đã chọn
        router.push(`/my-cv/new?template=${templateId}`);
      } else {
        console.error("Failed to create CV:", response);
        alert("Không thể tạo CV. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error creating CV from template:", error);
      alert("Có lỗi xảy ra khi tạo CV. Vui lòng thử lại.");
    } finally {
      setLoading(null);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Chọn Template</h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải templates...</p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Chọn Template</h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Không có template nào khả dụng.</p>
        </div>
      </div>
    );
  }

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
                  {loading === t.id ? "Đang tạo..." : "Dùng template này"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
