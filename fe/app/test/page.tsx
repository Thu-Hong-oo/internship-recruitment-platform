import { PageLayout } from "@/components/layout";

export default function TestPage() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Trang Test Navigation
        </h1>
        <p className="text-xl text-muted-foreground">
          Nếu bạn thấy trang này, navigation đã hoạt động!
        </p>
        <div className="mt-8">
          <a href="/" className="text-primary hover:text-primary/80 underline">
            ← Về trang chủ
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
