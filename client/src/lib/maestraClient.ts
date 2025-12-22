import type { ChatRequest, ChatResponse, PdfSession } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function sendChatMessage(
  sessionId: string,
  message: string,
  context?: string
): Promise<ChatResponse> {
  const request: ChatRequest = {
    sessionId,
    message,
    context,
  };
  
  return apiRequest<ChatResponse>("POST", "/api/maestra/chat", request);
}

export async function importPdf(
  fileName: string,
  fileData: string
): Promise<PdfSession> {
  return apiRequest<PdfSession>("POST", "/api/pdf/import", {
    fileName,
    fileData,
  });
}

export async function getSession(sessionId: string): Promise<PdfSession> {
  return apiRequest<PdfSession>("GET", `/api/pdf/session/${sessionId}`);
}

export async function updateSession(
  sessionId: string,
  updates: Partial<PdfSession>
): Promise<PdfSession> {
  return apiRequest<PdfSession>("PATCH", `/api/pdf/session/${sessionId}`, updates);
}
