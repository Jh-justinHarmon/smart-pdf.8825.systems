import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";
import { 
  FileText, 
  Download, 
  Share2, 
  Settings,
  Eye,
  Edit3,
  Sparkles
} from "lucide-react";

interface ToolbarProps {
  fileName: string | null;
  isSmartPdf: boolean;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
  onDownload: () => void;
  onShare: () => void;
}

export function Toolbar({
  fileName,
  isSmartPdf,
  mode,
  onModeChange,
  onDownload,
  onShare,
}: ToolbarProps) {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-between gap-4 px-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        
        <div className="min-w-0">
          {fileName ? (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-medium truncate max-w-[200px] lg:max-w-[300px]">
                {fileName}
              </h1>
              {isSmartPdf && (
                <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                  <Sparkles className="h-3 w-3" />
                  Smart PDF
                </Badge>
              )}
            </div>
          ) : (
            <h1 className="text-sm font-medium text-muted-foreground">
              Smart PDF Companion
            </h1>
          )}
        </div>
      </div>

      {fileName && (
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            size="sm"
            variant={mode === "view" ? "secondary" : "ghost"}
            className="h-7 text-xs gap-1"
            onClick={() => onModeChange("view")}
            data-testid="button-mode-view"
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            className="h-7 text-xs gap-1"
            onClick={() => onModeChange("edit")}
            data-testid="button-mode-edit"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        {fileName && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDownload}
              data-testid="button-download"
              aria-label="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onShare}
              data-testid="button-share"
              aria-label="Share PDF"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
