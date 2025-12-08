import { Sparkles, LayoutTemplate } from "lucide-react";
import TemplateGallery from "@/components/cv/TemplateGallery";
import PageLayout from "@/components/layout/PageLayout";

export default function CVTemplatesPage() {
  return (
    <PageLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-white py-10">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Bộ sưu tập template CV có sẵn
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-2">
                  Chọn mẫu CV phù hợp với bạn
                </h1>
              </div>
            </div>
          </div>

          {/* Template gallery */}
          <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-3 sm:p-4 lg:p-6 xl:p-8">
            <TemplateGallery />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
