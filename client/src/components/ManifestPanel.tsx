import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  FileText, 
  Calendar, 
  User, 
  Lock, 
  Unlock,
  Shield,
  Share2,
  Download,
  Edit3
} from "lucide-react";
import type { SmartPdfManifest, ManifestSection } from "@shared/schema";

interface ManifestPanelProps {
  manifest: SmartPdfManifest | null;
  isSmartPdf: boolean;
  fileName: string;
}

function SectionCard({ section }: { section: ManifestSection }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
          data-testid={`button-section-${section.id}`}
        >
          <span className="text-sm font-medium">{section.name}</span>
          <ChevronDown 
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`} 
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-2">
          {section.fields.map((field, index) => (
            <div 
              key={index} 
              className="grid grid-cols-2 gap-2 text-sm"
            >
              <span className="text-muted-foreground truncate">{field.name}</span>
              <span className="font-mono text-xs truncate">
                {Array.isArray(field.value) 
                  ? field.value.join(", ") 
                  : String(field.value ?? "—")}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ManifestPanel({ manifest, isSmartPdf, fileName }: ManifestPanelProps) {
  if (!manifest && !isSmartPdf) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Regular PDF</p>
        <p className="text-xs text-muted-foreground mt-1">
          This PDF does not contain a Smart PDF manifest
        </p>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              Smart PDF
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              v{manifest.version}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold leading-tight">
            {manifest.templateName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {manifest.templateType}
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(manifest.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span>{formatDate(manifest.updatedAt)}</span>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-3">Sections</h3>
          <div className="space-y-1 rounded-md border overflow-hidden">
            {manifest.sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-3">Permissions</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {manifest.permissions.canEdit ? (
                <Unlock className="h-4 w-4 text-status-online" />
              ) : (
                <Lock className="h-4 w-4 text-status-busy" />
              )}
              <span>Edit: {manifest.permissions.canEdit ? "Allowed" : "Restricted"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span>Share: {manifest.permissions.canShare ? "Allowed" : "Restricted"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>Export: {manifest.permissions.canExport ? "Allowed" : "Restricted"}</span>
            </div>
          </div>
        </div>

        {manifest.security && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Security</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Encryption: {manifest.security.encrypted ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Signature: {manifest.security.signatureRequired ? "Required" : "Optional"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
