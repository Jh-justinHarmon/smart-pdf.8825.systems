import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  FileText,
  CheckCircle
} from "lucide-react";
import type { ManifestVersion } from "@shared/schema";

interface HistoryPanelProps {
  versions: ManifestVersion[];
  currentVersion: string;
  onVersionSelect: (versionId: string) => void;
}

export function HistoryPanel({ 
  versions, 
  currentVersion, 
  onVersionSelect 
}: HistoryPanelProps) {
  if (!versions || versions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No Version History</p>
        <p className="text-xs text-muted-foreground mt-1">
          Version history will appear here after edits
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-4">Version History</h3>
        
        <div className="relative">
          <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
          
          <div className="space-y-4">
            {versions.map((version, index) => {
              const { date, time } = formatDate(version.timestamp);
              const isCurrent = version.version === currentVersion;
              
              return (
                <div 
                  key={version.id} 
                  className="relative pl-8"
                >
                  <div 
                    className={`absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                      isCurrent 
                        ? "bg-primary border-primary" 
                        : "bg-background border-muted-foreground/30"
                    }`}
                  />
                  
                  <Button
                    variant={isCurrent ? "secondary" : "ghost"}
                    className="w-full h-auto p-3 flex flex-col items-start gap-2"
                    onClick={() => onVersionSelect(version.id)}
                    data-testid={`button-version-${version.id}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Badge 
                        variant={isCurrent ? "default" : "outline"} 
                        className="text-xs font-mono"
                      >
                        v{version.version}
                      </Badge>
                      {isCurrent && (
                        <CheckCircle className="h-3 w-3 text-primary ml-auto" />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center gap-3 w-full">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {date} {time}
                      </span>
                    </div>
                    
                    {version.author && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.author}
                      </div>
                    )}
                    
                    {version.changes && (
                      <p className="text-xs text-left line-clamp-2">
                        {version.changes}
                      </p>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
