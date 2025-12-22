import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  importPdfRequestSchema, 
  chatRequestSchema,
  pdfSessionSchema,
  type ChatMessage,
} from "@shared/schema";
import { 
  detectSmartPdf as detectSmartPdfReal,
  extractManifest,
  chatWithMaestra,
  checkMaestraHealth
} from "./maestra-client";

const updateSessionSchema = pdfSessionSchema.partial().omit({ id: true });

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
      
      // Use real Smart PDF detection via Maestra backend
      const isSmartPdf = await detectSmartPdfReal(fileName);
      const manifest = isSmartPdf ? await extractManifest(fileName) : undefined;
      
      const session = await storage.createSession(fileName, isSmartPdf, manifest);
      res.json(session);
    } catch (error) {
      console.error("PDF import error:", error);
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

  app.get("/api/health", async (req, res) => {
    try {
      const maestraHealthy = await checkMaestraHealth();
      res.json({
        status: "ok",
        maestra: maestraHealthy ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ status: "error", error: "Health check failed" });
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
      
      // Use real Maestra chat via backend
      const { reply, suggestions } = await chatWithMaestra(sessionId, message, context);
      
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
      console.error("Maestra chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  return httpServer;
}
