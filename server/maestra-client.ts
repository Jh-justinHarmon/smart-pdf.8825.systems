/**
 * Maestra Backend Client
 * 
 * Connects Smart PDF Companion to real Maestra backend API (port 8825).
 * Replaces mocked functions with actual API calls.
 */

import type { SmartPdfManifest } from "@shared/schema";

const MAESTRA_BASE_URL = process.env.MAESTRA_URL || "http://localhost:8825";

interface MaestraImportResponse {
  success: boolean;
  template_data: any;
  pdf_id: string;
  manifest_version: string;
  library_entry_id?: string;
  imported_at: string;
  trace_id: string;
}

interface MaestraAdvisorResponse {
  answer: string;
  session_id: string;
  job_id?: string;
  sources: Array<{
    title: string;
    type: string;
    confidence: number;
    excerpt?: string;
  }>;
  trace_id: string;
  mode: string;
  processing_time_ms: number;
}

interface MaestraExportResponse {
  success: boolean;
  pdf_id: string;
  download_url: string;
  file_size_bytes: number;
  manifest_version: string;
  library_entry_id?: string;
  trace_id: string;
}

/**
 * Detect if a PDF is a Smart PDF by checking for Smart PDF indicators.
 * For now, use filename heuristics + try to extract manifest.
 */
export async function detectSmartPdf(fileName: string): Promise<boolean> {
  // Quick heuristic check
  const smartIndicators = ["_smart", ".spdf", "_manifest", "smart-", "intelligent-"];
  const lowerName = fileName.toLowerCase();
  
  if (smartIndicators.some(indicator => lowerName.includes(indicator))) {
    return true;
  }
  
  // If filename doesn't indicate Smart PDF, assume it's not
  // (Full detection would require reading PDF attachments)
  return false;
}

/**
 * Extract manifest from Smart PDF.
 */
export async function extractManifest(pdfPath: string): Promise<SmartPdfManifest | null> {
  try {
    const response = await fetch(`${MAESTRA_BASE_URL}/api/maestra/smart-pdf/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdf_url: pdfPath,
        validate_schema: true,
        create_library_entry: false,
      }),
    });

    if (!response.ok) {
      console.error("Manifest extraction failed:", response.statusText);
      return null;
    }

    const data: MaestraImportResponse = await response.json();
    
    // Convert Maestra template_data to SmartPdfManifest format
    const templateData = data.template_data;
    
    const manifest: SmartPdfManifest = {
      templateName: templateData.name,
      templateType: templateData.type,
      version: String(templateData.version),
      createdAt: templateData.created_at || new Date().toISOString(),
      updatedAt: templateData.updated_at || new Date().toISOString(),
      sections: templateData.sections.map((section: any) => ({
        id: section.section_id,
        name: section.title,
        fields: templateData.inputs
          .filter((input: any) => input.section === section.section_id)
          .map((input: any) => ({
            name: input.field_id,
            type: input.type,
            value: input.default_value || "",
            editable: true,
          })),
      })),
      versionHistory: templateData.history.map((h: any) => ({
        id: `v${h.version}`,
        version: String(h.version),
        timestamp: h.timestamp,
        author: h.author,
        changes: h.changes,
      })),
      permissions: {
        canEdit: templateData.permissions?.edit ?? true,
        canShare: templateData.permissions?.share ?? true,
        canExport: templateData.permissions?.export ?? true,
      },
      security: {
        encrypted: false,
        signatureRequired: templateData.permissions?.signature_required ?? false,
      },
    };

    return manifest;
  } catch (error) {
    console.error("Manifest extraction error:", error);
    return null;
  }
}

/**
 * Send message to Maestra advisor and get AI response.
 */
export async function chatWithMaestra(
  sessionId: string,
  message: string,
  context?: string
): Promise<{ reply: string; suggestions?: Array<{ id: string; text: string }> }> {
  try {
    const response = await fetch(`${MAESTRA_BASE_URL}/api/maestra/advisor/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: "smart-pdf-companion",
        question: context ? `${message}\n\nContext: ${context}` : message,
        mode: "quick",
        context_hints: context ? ["smart_pdf", "document_editing"] : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Maestra chat failed: ${response.statusText}`);
    }

    const data: MaestraAdvisorResponse = await response.json();
    
    // Generate suggestions if context was provided (text selection)
    let suggestions: Array<{ id: string; text: string }> | undefined;
    
    if (context && data.answer) {
      // Parse suggestions from Maestra's response
      // Look for numbered lists or bullet points
      const lines = data.answer.split('\n').filter(line => line.trim());
      const suggestionLines = lines.filter(line => 
        /^[\d\-\*]/.test(line.trim()) || line.includes('Option')
      );
      
      if (suggestionLines.length > 0) {
        suggestions = suggestionLines.slice(0, 3).map((line, idx) => ({
          id: `sug-${Date.now()}-${idx}`,
          text: line.replace(/^[\d\-\*\.\)]\s*/, '').trim(),
        }));
      }
    }

    return {
      reply: data.answer,
      suggestions,
    };
  } catch (error) {
    console.error("Maestra chat error:", error);
    
    // Fallback response
    return {
      reply: "I'm having trouble connecting to Maestra. Please check that the backend is running on port 8825.",
    };
  }
}

/**
 * Export template as Smart PDF.
 */
export async function exportSmartPdf(
  templateData: any,
  outputFilename: string,
  edgeConfig?: any
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${MAESTRA_BASE_URL}/api/maestra/smart-pdf/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_data: templateData,
        output_filename: outputFilename,
        edge_config: edgeConfig,
        create_library_entry: true,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Export failed: ${response.statusText}`,
      };
    }

    const data: MaestraExportResponse = await response.json();
    
    return {
      success: true,
      downloadUrl: data.download_url,
    };
  } catch (error) {
    console.error("Smart PDF export error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Health check for Maestra backend.
 */
export async function checkMaestraHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MAESTRA_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.error("Maestra health check failed:", error);
    return false;
  }
}
