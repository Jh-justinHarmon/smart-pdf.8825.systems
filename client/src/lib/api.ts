/**
 * API Client for Smart PDF Companion
 * 
 * Connects frontend to backend API endpoints.
 */

import type { SmartPdfManifest, ChatMessage } from "@shared/schema";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface PDFSession {
  id: string;
  fileName: string;
  isSmartPdf: boolean;
  manifest: SmartPdfManifest | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  messages: ChatMessage[];
}

interface ChatResponse {
  reply: string;
  suggestions?: Array<{
    id: string;
    text: string;
  }>;
}

interface HealthResponse {
  status: string;
  maestra: string;
  timestamp: string;
}

/**
 * Check backend health and Maestra connectivity
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

/**
 * Import a PDF and create a session
 */
export async function importPdf(fileName: string, fileData: string): Promise<PDFSession> {
  const response = await fetch(`${API_BASE}/api/pdf/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to import PDF");
  }

  return response.json();
}

/**
 * Get a PDF session by ID
 */
export async function getSession(sessionId: string): Promise<PDFSession> {
  const response = await fetch(`${API_BASE}/api/pdf/session/${sessionId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Session not found");
    }
    throw new Error("Failed to get session");
  }

  return response.json();
}

/**
 * Update a PDF session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<PDFSession, "currentPage" | "zoom">>
): Promise<PDFSession> {
  const response = await fetch(`${API_BASE}/api/pdf/session/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update session");
  }

  return response.json();
}

/**
 * Send a message to Maestra chat
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  context?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/maestra/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      message,
      context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

/**
 * Convert File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
