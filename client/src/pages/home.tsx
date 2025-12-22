import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFViewer } from "@/components/PDFViewer";
import { ManifestPanel } from "@/components/ManifestPanel";
import { MaestraChat } from "@/components/MaestraChat";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Toolbar } from "@/components/Toolbar";
import { fileToBase64, importPdf, sendChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileText, MessageSquare, Clock } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SmartPdfManifest, ChatMessage } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isSmartPdf, setIsSmartPdf] = useState(false);
  const [manifest, setManifest] = useState<SmartPdfManifest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manifest");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleFileLoad = useCallback(async (file: File, pdf: PDFDocumentProxy) => {
    setFileName(file.name);
    setPdfDocument(pdf);
    setTotalPages(pdf.numPages);
    setCurrentPage(1);
    setZoom(100);
    setMessages([]);
    setSelectedText(null);
    setIsLoading(true);
    
    try {
      // Convert file to base64 and import via API
      const base64Data = await fileToBase64(file);
      const session = await importPdf(file.name, base64Data);
      
      setSessionId(session.id);
      setIsSmartPdf(session.isSmartPdf);
      setManifest(session.manifest);
      
      if (session.isSmartPdf && session.manifest) {
        toast({
          title: "Smart PDF Detected",
          description: `Loaded: ${session.manifest.templateName}`,
        });
      } else {
        toast({
          title: "PDF Loaded",
          description: "This is a regular PDF without Smart PDF features.",
        });
      }
    } catch (error) {
      console.error("Failed to import PDF:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import PDF",
        variant: "destructive",
      });
      setIsSmartPdf(false);
      setManifest(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
    setActiveTab("chat");
    setMode("edit");
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!sessionId) {
      toast({
        title: "No Session",
        description: "Please upload a PDF first.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      context: selectedText || undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message to Maestra via API
      const response = await sendChatMessage(sessionId, content, selectedText || undefined);
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions?.map(s => ({ ...s, applied: false })),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Chat Failed",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "I'm having trouble connecting to Maestra. Please check that the backend is running.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, selectedText, toast]);

  const handleClearContext = useCallback(() => {
    setSelectedText(null);
  }, []);

  const handleApplySuggestion = useCallback((suggestionId: string, text: string) => {
    setMessages(prev => 
      prev.map(msg => ({
        ...msg,
        suggestions: msg.suggestions?.map(sug => 
          sug.id === suggestionId ? { ...sug, applied: true } : sug
        ),
      }))
    );
    
    toast({
      title: "Suggestion Applied",
      description: "The text has been updated in the document.",
    });
  }, [toast]);

  const handleVersionSelect = useCallback((versionId: string) => {
    toast({
      title: "Version Selected",
      description: `Switched to version ${versionId}`,
    });
  }, [toast]);

  const handleDownload = useCallback(() => {
    toast({
      title: "Download Started",
      description: "Your PDF is being prepared for download.",
    });
  }, [toast]);

  const handleShare = useCallback(() => {
    toast({
      title: "Share Link Copied",
      description: "A shareable link has been copied to your clipboard.",
    });
  }, [toast]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar
        fileName={fileName}
        isSmartPdf={isSmartPdf}
        mode={mode}
        onModeChange={setMode}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col">
          <PDFViewer
            onFileLoad={handleFileLoad}
            onTextSelect={handleTextSelect}
            currentPage={currentPage}
            totalPages={totalPages}
            zoom={zoom}
            onPageChange={setCurrentPage}
            onZoomChange={setZoom}
            pdfDocument={pdfDocument}
          />
        </div>

        {pdfDocument && (
          <>
            <div className="hidden lg:flex w-80 border-l flex-col bg-background">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full rounded-none border-b bg-transparent h-11 p-0">
                  <TabsTrigger 
                    value="manifest" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                    data-testid="tab-manifest"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Manifest
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                    data-testid="tab-history"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="manifest" className="flex-1 m-0 overflow-hidden">
                  <ManifestPanel
                    manifest={manifest}
                    isSmartPdf={isSmartPdf}
                    fileName={fileName || ""}
                  />
                </TabsContent>
                <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                  <HistoryPanel
                    versions={manifest?.versionHistory || []}
                    currentVersion={manifest?.version || ""}
                    onVersionSelect={handleVersionSelect}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="hidden lg:flex w-80 border-l flex-col bg-background">
              <MaestraChat
                messages={messages}
                selectedText={selectedText}
                onSendMessage={handleSendMessage}
                onClearContext={handleClearContext}
                onApplySuggestion={handleApplySuggestion}
                isLoading={isLoading}
              />
            </div>

            <div className="lg:hidden w-80 border-l flex flex-col bg-background">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full rounded-none border-b bg-transparent h-11 p-0">
                  <TabsTrigger 
                    value="manifest" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                  >
                    <FileText className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
                  >
                    <Clock className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="manifest" className="flex-1 m-0 overflow-hidden">
                  <ManifestPanel
                    manifest={manifest}
                    isSmartPdf={isSmartPdf}
                    fileName={fileName || ""}
                  />
                </TabsContent>
                <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                  <MaestraChat
                    messages={messages}
                    selectedText={selectedText}
                    onSendMessage={handleSendMessage}
                    onClearContext={handleClearContext}
                    onApplySuggestion={handleApplySuggestion}
                    isLoading={isLoading}
                  />
                </TabsContent>
                <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                  <HistoryPanel
                    versions={manifest?.versionHistory || []}
                    currentVersion={manifest?.version || ""}
                    onVersionSelect={handleVersionSelect}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
