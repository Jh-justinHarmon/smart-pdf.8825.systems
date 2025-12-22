import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  RotateCcw
} from "lucide-react";
import { loadPdfDocument, renderPage } from "@/lib/pdfUtils";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PDFViewerProps {
  onFileLoad: (file: File, pdf: PDFDocumentProxy) => void;
  onTextSelect: (text: string) => void;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  pdfDocument: PDFDocumentProxy | null;
}

export function PDFViewer({
  onFileLoad,
  onTextSelect,
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  pdfDocument,
}: PDFViewerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      await loadFile(files[0]);
    } else {
      setError("Please drop a valid PDF file");
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await loadFile(files[0]);
    }
  }, []);

  const loadFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const pdf = await loadPdfDocument(file);
      onFileLoad(file, pdf);
    } catch (err) {
      setError("Failed to load PDF. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pdfDocument && canvasRef.current && currentPage > 0) {
      const scale = zoom / 100 * 1.5;
      renderPage(pdfDocument, currentPage, canvasRef.current, scale);
    }
  }, [pdfDocument, currentPage, zoom]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onTextSelect(selection.toString().trim());
    }
  }, [onTextSelect]);

  const handleZoomIn = () => onZoomChange(Math.min(zoom + 25, 200));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 25, 50));
  const handleResetZoom = () => onZoomChange(100);
  const handlePrevPage = () => onPageChange(Math.max(currentPage - 1, 1));
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  if (!pdfDocument) {
    return (
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`
            w-full max-w-lg aspect-[4/3] rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-4 p-8
            transition-colors duration-200
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium">
                  Drop your PDF here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="input-pdf-upload"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div 
        className="flex-1 overflow-auto p-4 flex items-start justify-center bg-muted/30"
        onMouseUp={handleTextSelection}
      >
        <canvas 
          ref={canvasRef} 
          className="shadow-lg bg-white dark:bg-gray-100"
          data-testid="canvas-pdf"
        />
      </div>
      
      <div className="flex items-center justify-between gap-4 p-3 border-t bg-background">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            data-testid="button-zoom-out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono w-12 text-center">{zoom}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            data-testid="button-zoom-in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleResetZoom}
            data-testid="button-zoom-reset"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            data-testid="button-prev-page"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono min-w-[4rem] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            data-testid="button-next-page"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-24" />
      </div>
    </div>
  );
}
