import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function usePdfExport() {
  async function exportElementToPdf(el: HTMLElement, filename = "cv.pdf") {
    // Hide selection/controls if any by adding a class toggle from caller if needed
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      // Inject a stronger reset to avoid parsing unsupported color functions like 'oklch'
      onclone: (doc) => {
        const style = doc.createElement("style");
        style.setAttribute("data-export-reset", "true");
        // NOTE:
        // - Force simple hex/RGB-compatible colors and strip gradients/shadows.
        // - Target pseudo elements as well.
        // - Keep backgrounds transparent; the canvas gets a white bg via backgroundColor option.
        style.textContent = `
          *, .export-snapshot * {
            background-color: transparent !important;
            color: #111827 !important; /* neutral text */
            border-color: #e5e7eb !important;
            outline-color: #e5e7eb !important;
            text-decoration-color: #111827 !important;
            box-shadow: none !important;
            background-image: none !important; /* remove gradients */
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
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(filename);
  }
  return { exportElementToPdf };
}
