import * as pdfjsLib from "pdfjs-dist";
import type { SmartPdfManifest, ManifestVersion } from "@shared/schema";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function loadPdfDocument(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  return pdfjsLib.getDocument({ data: typedArray }).promise;
}

export async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<void> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const context = canvas.getContext("2d");
  if (!context) return;
  
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;
}

export function detectSmartPdf(fileName: string): boolean {
  // Check for smart PDF indicators in filename
  const smartIndicators = [
    "_smart",
    ".spdf",
    "_manifest",
    "smart-",
    "intelligent-",
  ];
  
  const lowerName = fileName.toLowerCase();
  return smartIndicators.some(indicator => lowerName.includes(indicator));
}

export function generateMockManifest(fileName: string): SmartPdfManifest {
  const now = new Date().toISOString();
  const templateName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  
  const versions: ManifestVersion[] = [
    {
      id: "v3",
      version: "3.0",
      timestamp: now,
      author: "Current User",
      changes: "Latest revision with updated content",
    },
    {
      id: "v2",
      version: "2.0",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: "Editor",
      changes: "Formatting improvements",
    },
    {
      id: "v1",
      version: "1.0",
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
      author: "Creator",
      changes: "Initial version",
    },
  ];

  return {
    templateName: templateName.charAt(0).toUpperCase() + templateName.slice(1),
    templateType: "Document",
    version: "3.0",
    createdAt: versions[2].timestamp,
    updatedAt: now,
    sections: [
      {
        id: "header",
        name: "Header Section",
        fields: [
          { name: "Title", type: "text", value: templateName, editable: true },
          { name: "Author", type: "text", value: "Document Author", editable: true },
          { name: "Date", type: "date", value: now.split("T")[0], editable: true },
        ],
      },
      {
        id: "content",
        name: "Content Section",
        fields: [
          { name: "Body Text", type: "text", value: "Document content...", editable: true },
          { name: "Page Count", type: "number", value: 1, editable: false },
        ],
      },
      {
        id: "metadata",
        name: "Metadata",
        fields: [
          { name: "Keywords", type: "array", value: ["document", "smart", "pdf"], editable: true },
          { name: "Category", type: "text", value: "General", editable: true },
        ],
      },
    ],
    versionHistory: versions,
    permissions: {
      canEdit: true,
      canShare: true,
      canExport: true,
    },
    security: {
      encrypted: false,
      signatureRequired: false,
    },
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
