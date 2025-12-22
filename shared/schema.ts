import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Smart PDF Manifest Schema
export const manifestFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["text", "number", "date", "boolean", "array", "object"]),
  value: z.any().optional(),
  editable: z.boolean().default(true),
});

export const manifestSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(manifestFieldSchema),
});

export const manifestVersionSchema = z.object({
  id: z.string(),
  version: z.string(),
  timestamp: z.string(),
  author: z.string().optional(),
  changes: z.string().optional(),
});

export const smartPdfManifestSchema = z.object({
  templateName: z.string(),
  templateType: z.string(),
  version: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sections: z.array(manifestSectionSchema),
  versionHistory: z.array(manifestVersionSchema),
  permissions: z.object({
    canEdit: z.boolean(),
    canShare: z.boolean(),
    canExport: z.boolean(),
  }),
  security: z.object({
    encrypted: z.boolean(),
    signatureRequired: z.boolean(),
  }).optional(),
});

export type ManifestField = z.infer<typeof manifestFieldSchema>;
export type ManifestSection = z.infer<typeof manifestSectionSchema>;
export type ManifestVersion = z.infer<typeof manifestVersionSchema>;
export type SmartPdfManifest = z.infer<typeof smartPdfManifestSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
  context: z.string().optional(),
  suggestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    applied: z.boolean().default(false),
  })).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// PDF Session schema
export const pdfSessionSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  isSmartPdf: z.boolean(),
  manifest: smartPdfManifestSchema.optional(),
  currentPage: z.number().default(1),
  totalPages: z.number().default(0),
  zoom: z.number().default(100),
  selectedText: z.string().optional(),
  messages: z.array(chatMessageSchema).default([]),
});

export type PdfSession = z.infer<typeof pdfSessionSchema>;

// API Request/Response types
export const importPdfRequestSchema = z.object({
  fileName: z.string(),
  fileData: z.string(), // base64 encoded
});

export const chatRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  context: z.string().optional(),
});

export const chatResponseSchema = z.object({
  reply: z.string(),
  suggestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).optional(),
});

export type ImportPdfRequest = z.infer<typeof importPdfRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
