import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  importPdfRequestSchema, 
  chatRequestSchema,
  pdfSessionSchema,
  type ChatMessage,
  type SmartPdfManifest,
  type ManifestVersion
} from "@shared/schema";

const updateSessionSchema = pdfSessionSchema.partial().omit({ id: true });

function detectSmartPdf(fileName: string): boolean {
  const smartIndicators = ["_smart", ".spdf", "_manifest", "smart-", "intelligent-"];
  const lowerName = fileName.toLowerCase();
  return smartIndicators.some(indicator => lowerName.includes(indicator));
}

function generateMockManifest(fileName: string): SmartPdfManifest {
  const now = new Date().toISOString();
  const templateName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  
  const versions: ManifestVersion[] = [
    { id: "v3", version: "3.0", timestamp: now, author: "Current User", changes: "Latest revision" },
    { id: "v2", version: "2.0", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), author: "Editor", changes: "Formatting" },
    { id: "v1", version: "1.0", timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), author: "Creator", changes: "Initial" },
  ];

  return {
    templateName: templateName.charAt(0).toUpperCase() + templateName.slice(1),
    templateType: "Document",
    version: "3.0",
    createdAt: versions[2].timestamp,
    updatedAt: now,
    sections: [
      { id: "header", name: "Header Section", fields: [
        { name: "Title", type: "text", value: templateName, editable: true },
        { name: "Author", type: "text", value: "Author", editable: true },
      ]},
      { id: "content", name: "Content", fields: [
        { name: "Body", type: "text", value: "Content...", editable: true },
      ]},
    ],
    versionHistory: versions,
    permissions: { canEdit: true, canShare: true, canExport: true },
    security: { encrypted: false, signatureRequired: false },
  };
}

function generateChatResponse(message: string, context?: string): { reply: string; suggestions?: { id: string; text: string }[] } {
  const suggestions = context ? [
    { id: `sug-${Date.now()}-1`, text: context.split(' ').slice(0, Math.ceil(context.split(' ').length * 0.7)).join(' ') + "." },
    { id: `sug-${Date.now()}-2`, text: `Regarding: ${context.split(' ').slice(0, 8).join(' ')}...` },
  ] : undefined;

  const reply = context 
    ? "I've analyzed your selection and prepared rewrite suggestions. Choose one that fits your needs."
    : "I'm here to help edit your PDF. Select text to get rewrite suggestions, or ask me anything.";

  return { reply, suggestions };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/pdf/import", async (req, res) => {
    try {
      const parsed = importPdfRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      }

      const { fileName } = parsed.data;
      const isSmartPdf = detectSmartPdf(fileName);
      const manifest = isSmartPdf ? generateMockManifest(fileName) : undefined;
      
      const session = await storage.createSession(fileName, isSmartPdf, manifest);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to import PDF" });
    }
  });

  app.get("/api/pdf/session/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.patch("/api/pdf/session/:id", async (req, res) => {
    try {
      const parsed = updateSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      }
      
      const session = await storage.updateSession(req.params.id, parsed.data);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.post("/api/maestra/chat", async (req, res) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      }

      const { sessionId, message, context } = parsed.data;
      
      const existingSession = await storage.getSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        context,
      };
      
      await storage.addMessage(sessionId, userMessage);
      
      const { reply, suggestions } = generateChatResponse(message, context);
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
        suggestions: suggestions?.map(s => ({ ...s, applied: false })),
      };
      
      await storage.addMessage(sessionId, assistantMessage);
      
      res.json({ reply, suggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  return httpServer;
}
