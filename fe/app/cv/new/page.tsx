/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CVEditor from "../../../components/cv/CVEditor";
import { sampleCVs, type CVData } from "../../../lib/mocks/cvSamples";

export default function Page() {
  const params = useSearchParams();
  const templateId = Number(params.get("template") || 1);

  const initial: CVData = useMemo(() => {
    const base = sampleCVs[0];
    return {
      ...base,
      templateId:
        Number.isFinite(templateId) && templateId > 0 ? templateId : 1,
    };
  }, [templateId]);

  const [data, setData] = useState<CVData>(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  return <CVEditor data={data} onChange={setData} />;
}
