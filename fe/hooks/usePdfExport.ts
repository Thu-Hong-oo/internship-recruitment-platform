import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

export function usePdfExport() {
  async function exportElementToPdf(el: HTMLElement, filename = "cv.pdf") {
    // Ensure web fonts are loaded
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    // Mark element for export
    const prevClass = el.className;
    if (!el.classList.contains("export-snapshot")) {
      el.classList.add("export-snapshot");
    }

    // Prefer html-to-image for better CSS fidelity
    let dataUrl: string | null = null;
    try {
      const rect = el.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const pixelRatio = 2;
      dataUrl = await htmlToImage.toPng(el, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#ffffff",
        width,
        height,
        canvasWidth: width * pixelRatio,
        canvasHeight: height * pixelRatio,
        style: {
          boxShadow: "none",
          margin: "0",
          transform: "none",
          filter: "none",
          backgroundColor: "#ffffff",
        } as any,
        filter: (node) => {
          const elem = node as HTMLElement;
          if (!elem) return true;
          const cls = (elem.className || "").toString();
          if (cls.includes("ui-only") || cls.includes("no-export"))
            return false;
          return true;
        },
      });
    } catch {
      dataUrl = null;
    }

    // Fallback to html2canvas with strict reset to avoid oklch issues
    if (!dataUrl) {
      const rect = el.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        x: 0,
        y: 0,
        width,
        height,
        scrollX: 0,
        scrollY: 0,
        onclone: (doc) => {
          const style = doc.createElement("style");
          style.setAttribute("data-export-reset", "true");
          style.textContent = `
            *, .export-snapshot * {
              background-color: transparent !important;
              color: #111827 !important;
              border-color: #e5e7eb !important;
              outline-color: #e5e7eb !important;
              text-decoration-color: #111827 !important;
              box-shadow: none !important;
              background-image: none !important;
              fill: #111827 !important;
              stroke: #111827 !important;
            }
            *::before, *::after, .export-snapshot *::before, .export-snapshot *::after {
              background: transparent !important;
              background-image: none !important;
              box-shadow: none !important;
              color: #111827 !important;
              border-color: #e5e7eb !important;
            }
          `;
          doc.head.appendChild(style);
        },
      });
      dataUrl = canvas.toDataURL("image/png");
    }

    // Restore classes
    el.className = prevClass;

    // Create PDF with image
    const img = new Image();
    img.src = dataUrl!;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const ratio = Math.min(pageWidth / naturalW, pageHeight / naturalH);
    const imgWidth = naturalW * ratio;
    const imgHeight = naturalH * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    pdf.addImage(dataUrl!, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(filename);
  }
  return { exportElementToPdf };
}
