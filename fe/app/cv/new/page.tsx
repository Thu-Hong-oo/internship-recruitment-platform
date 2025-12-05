/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CVEditor from "../../../components/cv/CVEditor";
import { sampleCVs, type CVData } from "../../../lib/mocks/cvSamples";
import { candidateService } from "../../../lib/api/services/candidate.service";

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();

  const templateParam = params.get("template") || "modern";
  const resumeIdParam = params.get("resumeId");

  const [templateMap, setTemplateMap] = useState<Record<string, string>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [data, setData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(
    resumeIdParam || null
  );

  // Load template-resume map on mount
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await candidateService.getTemplateResumeMap();
        if (res.success && res.data?.map) {
          setTemplateMap(res.data.map);
        }
      } catch (err) {
        console.error("Không thể tải map template CV:", err);
      } finally {
        setMapLoaded(true);
      }
    };
    fetchMap();
  }, []);

  // Lấy CV ban đầu: ưu tiên resumeId trên URL, sau đó map, cuối cùng create
  useEffect(() => {
    const load = async () => {
      if (!mapLoaded) return;

      try {
        setLoading(true);
        setError(null);

        const mappedId = templateMap[templateParam];
        const targetResumeId = resumeIdParam || mappedId || null;

        if (targetResumeId) {
          const res = await candidateService.getResumeById(targetResumeId);
          if (!res.success || !res.data) {
            throw new Error("Không thể tải CV từ ResumeBuilder");
          }
          const content = (res.data.content || sampleCVs[0]) as CVData;
          setData({
            ...content,
            templateId: (content as any).templateId || templateParam,
          });
          setResumeId(res.data.resumeId);

          // Nếu map trả resumeId nhưng URL chưa có thì cập nhật URL
          if (!resumeIdParam) {
            const qs = new URLSearchParams(Array.from(params.entries()));
            qs.set("resumeId", res.data.resumeId);
            router.replace(`/cv/new?${qs.toString()}`);
          }
          return;
        }

        // Chưa có resume cho template này -> tạo mới
        const createRes = await candidateService.createCVFromTemplate(
          templateParam,
          true
        );
        if (!createRes.success || !createRes.data?.resume) {
          throw new Error("Không thể tạo CV từ template");
        }
        const { resume } = createRes.data;
        const content = (resume.content || sampleCVs[0]) as CVData;
        setData({
          ...content,
          templateId: (content as any).templateId || templateParam,
        });
        setResumeId(resume._id);
        setTemplateMap((prev) => ({
          ...prev,
          [templateParam]: resume._id,
        }));

        const qs = new URLSearchParams(Array.from(params.entries()));
        qs.set("resumeId", resume._id);
        router.replace(`/cv/new?${qs.toString()}`);
      } catch (e: any) {
        console.error("Error loading CV:", e);
        setError(e?.message || "Không thể tải CV");
        setData(sampleCVs[0]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateParam, resumeIdParam, mapLoaded, templateMap]);

  const handleChange = (next: CVData) => {
    setData(next);
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {error || "Đang tải CV..."}
      </div>
    );
  }

  return (
    <CVEditor
      data={data}
      onChange={handleChange}
      templateId={String(templateParam)}
      resumeId={resumeId || undefined}
    />
  );
}
