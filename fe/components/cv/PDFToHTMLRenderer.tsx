"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PDFToHTMLRendererProps {
  pdfUrl: string;
  onRendered?: (htmlContent: string) => void;
  editable?: boolean;
  onTextChange?: (pageIndex: number, textIndex: number, newText: string) => void;
}

/**
 * Render PDF to HTML while preserving exact layout, colors, fonts, and graphics
 * Similar to TopCV's approach - converts PDF pages to HTML/CSS with canvas background
 */
export default function PDFToHTMLRenderer({
  pdfUrl,
  onRendered,
  editable = false,
  onTextChange,
}: PDFToHTMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Array<{ 
    html: string; 
    width: number; 
    height: number;
    backgroundImage: string;
  }>>([]);

  useEffect(() => {
    if (!pdfUrl) return;

    const renderPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import pdfjs-dist only on client
        const pdfjsLib = await import("pdfjs-dist");
        
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        // Load PDF
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          useSystemFonts: true,
          verbosity: 0,
        });

        const pdf = await loadingTask.promise;
        const renderedPages: Array<{ 
          html: string; 
          width: number; 
          height: number;
          backgroundImage: string;
        }> = [];

        // Render each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
          
          // Step 1: Render page to canvas (gets graphics, colors, background)
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Cannot get canvas context");
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to base64 image (background layer)
          const backgroundImage = canvas.toDataURL("image/png");
          
          // Step 2: Get text content with styling
          const textContent = await page.getTextContent();
          
          // Step 3: Build HTML with background image + text overlay
          const pageHTML = await renderPageToHTML(
            viewport,
            textContent,
            backgroundImage,
            pageNum - 1,
            editable,
            onTextChange
          );

          renderedPages.push({
            html: pageHTML,
            width: viewport.width,
            height: viewport.height,
            backgroundImage,
          });
        }

        setPages(renderedPages);
        
        // Combine all pages HTML
        const fullHTML = renderedPages.map(p => p.html).join('');
        onRendered?.(fullHTML);
        
        setLoading(false);
      } catch (err: any) {
        console.error("Error rendering PDF to HTML:", err);
        setError(err.message || "Không thể render PDF");
        setLoading(false);
      }
    };

    renderPDF();
  }, [pdfUrl, editable, onRendered, onTextChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Đang render PDF thành HTML...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center text-red-600">
          <p className="font-semibold">Lỗi render PDF</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {pages.map((page, index) => (
        <div
          key={index}
          className="mb-4 mx-auto bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            position: "relative",
          }}
        >
          {/* Background layer - Canvas rendered as image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${page.backgroundImage})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top left",
            }}
          />
          
          {/* Text overlay layer - Editable text elements */}
          <div
            className="absolute inset-0"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Render a single PDF page to HTML with exact positioning
 * Background: Canvas image (graphics, colors, shapes)
 * Foreground: Text elements with absolute positioning
 */
async function renderPageToHTML(
  viewport: any,
  textContent: any,
  backgroundImage: string,
  pageIndex: number,
  editable: boolean,
  onTextChange?: (pageIndex: number, textIndex: number, newText: string) => void
): Promise<string> {
  const items = textContent.items || [];
  let html = '';

  // Group text items by line/position for better rendering
  const textElements: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontName: string;
    color: string;
    transform: number[];
    width: number;
    height: number;
  }> = [];

  items.forEach((item: any) => {
    if (item.str && item.str.trim()) {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4] || 0;
      const y = viewport.height - (transform[5] || 0); // Flip Y coordinate (PDF uses bottom-left origin)
      
      textElements.push({
        text: item.str,
        x,
        y: y - (item.height || 12), // Adjust for baseline
        fontSize: item.height || 12,
        fontName: item.fontName || "Arial",
        color: item.color || "#000000",
        transform,
        width: item.width || 0,
        height: item.height || 12,
      });
    }
  });

  // Render text elements with exact positioning (overlay on background)
  textElements.forEach((elem, index) => {
    // Calculate text color from transform or use default
    const textColor = elem.color || "#000000";
    
    const style = `
      position: absolute;
      left: ${elem.x}px;
      top: ${elem.y}px;
      font-size: ${elem.fontSize}px;
      font-family: "${elem.fontName}", Arial, sans-serif;
      color: ${textColor};
      white-space: nowrap;
      line-height: 1;
      pointer-events: ${editable ? 'auto' : 'none'};
      ${editable ? `
        cursor: text;
        outline: 1px dashed rgba(59, 130, 246, 0.3);
        background: rgba(255, 255, 255, 0.1);
        min-width: ${Math.max(elem.width, 20)}px;
        min-height: ${elem.height}px;
        padding: 2px 4px;
        border-radius: 2px;
        transition: all 0.2s;
      ` : ''}
      ${editable ? `
        &:hover {
          background: rgba(59, 130, 246, 0.1);
          outline-color: rgba(59, 130, 246, 0.5);
        }
        &:focus {
          background: rgba(255, 255, 255, 0.9);
          outline: 2px solid rgba(59, 130, 246, 0.8);
          z-index: 10;
        }
      ` : ''}
    `.replace(/\s+/g, ' ').trim();

    if (editable) {
      html += `
        <div
          contenteditable="true"
          data-page="${pageIndex}"
          data-index="${index}"
          style="${style}"
          oninput="handleTextChange(${pageIndex}, ${index}, this.innerText)"
          onfocus="this.style.background='rgba(255,255,255,0.9)'; this.style.outline='2px solid rgba(59,130,246,0.8)'; this.style.zIndex='10';"
          onblur="this.style.background='rgba(255,255,255,0.1)'; this.style.outline='1px dashed rgba(59,130,246,0.3)'; this.style.zIndex='1';"
        >${escapeHtml(elem.text)}</div>
      `;
    } else {
      html += `<div style="${style}">${escapeHtml(elem.text)}</div>`;
    }
  });

  // Add global handler for text changes
  if (editable && typeof window !== "undefined") {
    (window as any).handleTextChange = (pageIdx: number, textIdx: number, newText: string) => {
      onTextChange?.(pageIdx, textIdx, newText);
    };
  }

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

