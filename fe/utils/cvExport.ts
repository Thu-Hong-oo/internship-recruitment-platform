import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import type { CVData } from "@/lib/mocks/cvSamples";
import LivePreview from "@/components/cv/LivePreview";
import { createRoot } from "react-dom/client";

/**
 * Export CV online thành PDF và trả về File object (không download)
 */
export async function exportCVOnlineToPDF(
  cvData: CVData,
  templateId: string,
  filename: string = "cv.pdf"
): Promise<File> {
  // Tạo container ẩn để render CV - đảm bảo có đủ kích thước và visibility
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px"; // A4 width in pixels
  container.style.height = "1123px"; // A4 height in pixels
  container.style.backgroundColor = "#ffffff";
  container.style.overflow = "visible";
  container.style.zIndex = "-9999";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  try {
    // Đợi fonts load trước
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    // Render CV vào container sử dụng LivePreview (giống như CVEditor)
    const root = createRoot(container);
    root.render(
      React.createElement(LivePreview, {
        data: cvData,
        templateId: templateId,
        editable: false,
        editingField: null,
        containerRef: () => {},
        onChangeText: () => {},
        onFocusField: () => {},
        onBlurField: () => {},
        onAddItem: () => {},
        onDeleteItem: () => {},
        onDuplicateItem: () => {},
        onMoveItemUp: () => {},
        onMoveItemDown: () => {},
        onUpdateSectionTitle: () => {},
        getSectionTitle: (s: string, d: string) => d,
        onAvatarChange: () => {},
      })
    );

    // Đợi React render xong (flush DOM updates)
    await new Promise<void>((resolve) => {
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Đợi thêm một chút để đảm bảo layout hoàn tất
    await new Promise<void>((resolve) => setTimeout(resolve, 500));

    // Đợi tất cả images load
    const images = container.querySelectorAll("img");
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even on error to not block
                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000);
              }
            })
        )
      );
    }

    // Đợi thêm một chút để đảm bảo mọi thứ đã render xong
    await new Promise<void>((resolve) => setTimeout(resolve, 300));

    // Đợi fonts load
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }

    // Debug: Kiểm tra container có nội dung không
    console.log("Container children:", container.children.length);
    console.log("Container innerHTML length:", container.innerHTML.length);

    // Tìm element con chứa CV (thường là div đầu tiên bên trong)
    let targetElement: HTMLElement = container;
    const firstChild = container.firstElementChild as HTMLElement;

    if (firstChild) {
      console.log(
        "First child found:",
        firstChild.tagName,
        firstChild.className
      );
      const rect = firstChild.getBoundingClientRect();
      console.log("First child dimensions:", rect.width, rect.height);

      if (firstChild.children.length > 0) {
        // Tìm element có width/height thực tế
        const cvElement = Array.from(firstChild.children).find((el) => {
          const elRect = (el as HTMLElement).getBoundingClientRect();
          return elRect.width > 100 && elRect.height > 100;
        }) as HTMLElement;
        if (cvElement) {
          console.log(
            "Found CV element:",
            cvElement.tagName,
            cvElement.className
          );
          targetElement = cvElement;
        } else {
          console.log("Using first child as target");
          targetElement = firstChild;
        }
      } else {
        console.log("First child has no children, using first child");
        targetElement = firstChild;
      }
    } else {
      console.warn("No first child found, using container");
    }

    // Đảm bảo target element có kích thước
    const finalRect = targetElement.getBoundingClientRect();
    console.log("Final target dimensions:", finalRect.width, finalRect.height);

    if (finalRect.width === 0 || finalRect.height === 0) {
      console.warn("Target element has zero dimensions, forcing size");
      targetElement.style.width = "794px";
      targetElement.style.height = "1123px";
    }

    // Đảm bảo target element có visibility
    const originalVisibility = targetElement.style.visibility;
    const originalDisplay = targetElement.style.display;
    targetElement.style.visibility = "visible";
    targetElement.style.display = "block";

    // Export element thành image
    let dataUrl: string | null = null;
    try {
      const rect = targetElement.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)) || 794;
      const height = Math.max(1, Math.round(rect.height)) || 1123;
      const pixelRatio = 1.5; // Higher quality for application

      dataUrl = await htmlToImage.toJpeg(targetElement, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#ffffff",
        width,
        height,
        canvasWidth: width * pixelRatio,
        canvasHeight: height * pixelRatio,
        quality: 0.9,
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
    } catch (err) {
      console.error("html-to-image failed, trying html2canvas:", err);
      // Fallback to html2canvas
      const canvas = await html2canvas(targetElement, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        x: 0,
        y: 0,
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging for debugging
      });
      dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    } finally {
      // Restore original styles
      targetElement.style.visibility = originalVisibility;
      targetElement.style.display = originalDisplay;
    }

    if (!dataUrl) {
      throw new Error("Failed to generate image from CV");
    }

    // Tạo PDF từ image
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    const pdf = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const ratio = Math.min(pageWidth / naturalW, pageHeight / naturalH);
    const imgWidth = naturalW * ratio;
    const imgHeight = naturalH * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(dataUrl, "JPEG", x, y, imgWidth, imgHeight);

    // Convert PDF blob to File
    const pdfBlob = pdf.output("blob");
    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    return file;
  } finally {
    // Cleanup
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Validate file upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowedExtensions = [".pdf", ".doc", ".docx"];

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File quá lớn. Kích thước tối đa là 10MB.",
    };
  }

  // Check file type
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (
    !allowedTypes.includes(file.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    return {
      valid: false,
      error: "Định dạng file không hợp lệ. Chỉ chấp nhận PDF, DOC, DOCX.",
    };
  }

  return { valid: true };
}
