# Smart PDF Companion

## Overview

Smart PDF Companion is a web application for viewing and interacting with Smart PDFs through an AI-powered chat interface. The app enables users to upload PDFs, detect if they are "Smart PDFs" with embedded manifest data, view document metadata and version history, and use AI assistance (Maestra) to rewrite and edit content. The core workflow involves PDF viewing, manifest extraction, AI-powered text suggestions, and version management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: React hooks with TanStack React Query for server state
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **PDF Rendering**: pdf.js library for client-side PDF display and manipulation

**Layout Pattern**: Three-zone layout with PDF viewer taking primary space (60%), manifest panel (20%), and chat panel (20%). Responsive design collapses to tabs on smaller viewports.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: HTTP server with Vite dev middleware in development
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Session Storage**: In-memory storage for PDF sessions (designed for PostgreSQL migration)

**Key Endpoints**:
- `POST /api/pdf/import` - Upload and process PDFs
- `GET/PATCH /api/pdf/session/:id` - Session management
- `POST /api/maestra/chat` - AI chat interface

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all type definitions and Zod validation schemas
- **Current Storage**: In-memory Map-based storage (`server/storage.ts`)
- **Database Ready**: Drizzle config exists for PostgreSQL migration when DATABASE_URL is provided

**Core Data Types**:
- `PdfSession` - Tracks uploaded PDF state, pages, zoom, messages
- `SmartPdfManifest` - Structured document metadata with sections, fields, versions
- `ChatMessage` - AI conversation messages with optional suggestions

### Build System
- **Development**: Vite dev server with HMR
- **Production**: esbuild for server bundling, Vite for client
- **Output**: `dist/` directory with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### Third-Party Services
- **Maestra Backend API** (port 8825): AI service for document rewriting and chat interactions. Currently mocked in server routes.

### Key Libraries
- **pdf.js**: PDF rendering via CDN worker
- **Drizzle ORM + drizzle-zod**: Database ORM with Zod schema generation
- **Radix UI**: Accessible component primitives
- **TanStack React Query**: Async state management
- **Zod**: Runtime type validation

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Schema Push**: `npm run db:push` applies schema changes

### Fonts (CDN)
- Inter (UI text)
- JetBrains Mono (monospace/code)
- DM Sans, Geist Mono, Fira Code (additional typography)