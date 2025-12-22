import { randomUUID } from "crypto";
import type { 
  PdfSession, 
  ChatMessage, 
  SmartPdfManifest 
} from "@shared/schema";

export interface IStorage {
  createSession(fileName: string, isSmartPdf: boolean, manifest?: SmartPdfManifest): Promise<PdfSession>;
  getSession(id: string): Promise<PdfSession | undefined>;
  updateSession(id: string, updates: Partial<PdfSession>): Promise<PdfSession | undefined>;
  addMessage(sessionId: string, message: ChatMessage): Promise<PdfSession | undefined>;
  deleteSession(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, PdfSession>;

  constructor() {
    this.sessions = new Map();
  }

  async createSession(
    fileName: string, 
    isSmartPdf: boolean, 
    manifest?: SmartPdfManifest
  ): Promise<PdfSession> {
    const id = randomUUID();
    const session: PdfSession = {
      id,
      fileName,
      isSmartPdf,
      manifest,
      currentPage: 1,
      totalPages: 0,
      zoom: 100,
      messages: [],
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<PdfSession | undefined> {
    return this.sessions.get(id);
  }

  async updateSession(
    id: string, 
    updates: Partial<PdfSession>
  ): Promise<PdfSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);
    return updated;
  }

  async addMessage(
    sessionId: string, 
    message: ChatMessage
  ): Promise<PdfSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    session.messages.push(message);
    this.sessions.set(sessionId, session);
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }
}

export const storage = new MemStorage();
