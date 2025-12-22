import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFViewer } from "@/components/PDFViewer";
import { ManifestPanel } from "@/components/ManifestPanel";
import { MaestraChat } from "@/components/MaestraChat";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Toolbar } from "@/components/Toolbar";
import { detectSmartPdf, generateMockManifest } from "@/lib/pdfUtils";
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

  const handleFileLoad = useCallback((file: File, pdf: PDFDocumentProxy) => {
    setFileName(file.name);
    setPdfDocument(pdf);
    setTotalPages(pdf.numPages);
    setCurrentPage(1);
    setZoom(100);
    setMessages([]);
    setSelectedText(null);
    
    const isSmart = detectSmartPdf(file.name);
    setIsSmartPdf(isSmart);
    
    if (isSmart) {
      const mockManifest = generateMockManifest(file.name);
      setManifest(mockManifest);
      toast({
        title: "Smart PDF Detected",
        description: "Manifest data has been extracted successfully.",
      });
    } else {
      setManifest(null);
      toast({
        title: "PDF Loaded",
        description: "This is a regular PDF without Smart PDF features.",
      });
    }
  }, [toast]);

  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
    setActiveTab("chat");
    setMode("edit");
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      context: selectedText || undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const suggestions = selectedText ? [
        {
          id: `sug-${Date.now()}-1`,
          text: content.toLowerCase().includes("concise") 
            ? selectedText.split(' ').slice(0, Math.ceil(selectedText.split(' ').length * 0.6)).join(' ') + "."
            : selectedText.replace(/\./g, '!'),
          applied: false,
        },
        {
          id: `sug-${Date.now()}-2`,
          text: content.toLowerCase().includes("formal")
            ? `Regarding the matter of: ${selectedText}`
            : `Here's the key point: ${selectedText.split(' ').slice(0, 10).join(' ')}...`,
          applied: false,
        },
      ] : undefined;

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: selectedText 
          ? "I've analyzed the selected text and prepared some rewrite suggestions for you. Choose the one that best fits your needs, or let me know if you'd like different alternatives."
          : "I'm here to help you edit and improve your PDF. Select some text in the document, and I can suggest rewrites, or ask me any questions about the content.",
        timestamp: new Date().toISOString(),
        suggestions,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [selectedText]);

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
