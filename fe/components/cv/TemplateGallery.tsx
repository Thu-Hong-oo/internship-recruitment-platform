import Link from "next/link";
import Image from "next/image";
import { templates } from "../../lib/mocks/templates";

export default function TemplateGallery() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Chọn Template</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="border rounded-lg overflow-hidden shadow-sm">
            <div className="relative w-full aspect-[3/4] bg-gray-50">
              {/* Using next/image if these thumbnails exist, fallback to img if not */}
              {t.thumbnail ? (
                <Image src={t.thumbnail} alt={t.name} fill style={{ objectFit: "cover" }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/placeholder.png" alt={t.name} />
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="font-medium">{t.name}</div>
              <Link
                href={`/cv/new?template=${t.id}`}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                Dùng
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


