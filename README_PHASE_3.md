# Smart PDF Companion - Phase 3: Maestra Integration

**Status:** Phase 3a ✅ Complete | Phase 3b 🔄 Deployment Ready | Phase 3c ⏳ Next

---

## Quick Start

### Local Development

```bash
# 1. Start Maestra backend
cd 8825_core/tools/maestra_backend
python3 server.py

# 2. Install dependencies
cd smart-pdf-companion
npm install

# 3. Start companion
PORT=5000 npm run dev

# 4. Test integration
curl http://127.0.0.1:5000/api/health
```

### Replit Deployment

```bash
# 1. Push to GitHub (already done)
git push

# 2. Replit auto-deploys from main branch
# 3. Verify at https://smart-pdf.8825.systems/api/health
```

---

## What's Working

✅ **Smart PDF Detection** - Filename-based detection for Smart PDFs
✅ **Manifest Extraction** - Real manifest data from Maestra backend
✅ **Session Management** - Create, retrieve, update PDF sessions
✅ **Maestra Chat** - Real AI responses with suggestions
✅ **Health Check** - Backend connectivity verification
✅ **Error Handling** - Graceful error responses
✅ **TypeScript Types** - Full type safety

---

## Architecture

```
Frontend (React)              Backend (Express)           Maestra (FastAPI)
┌──────────────────┐         ┌──────────────────┐       ┌──────────────────┐
│ PDF Viewer       │         │ /api/pdf/import  │──────→│ Smart PDF Import  │
│ Chat Interface   │────────→│ /api/maestra/chat│──────→│ Advisor Chat      │
│ Manifest Display │         │ /api/health      │──────→│ Health Check      │
└──────────────────┘         └──────────────────┘       └──────────────────┘
```

---

## API Endpoints

### Health Check
```
GET /api/health
Response: { status, maestra, timestamp }
```

### PDF Import
```
POST /api/pdf/import
Body: { fileName, fileData }
Response: { id, fileName, isSmartPdf, manifest, ... }
```

### Get Session
```
GET /api/pdf/session/:id
Response: Full session with manifest
```

### Update Session
```
PATCH /api/pdf/session/:id
Body: { currentPage, zoom, ... }
Response: Updated session
```

### Maestra Chat
```
POST /api/maestra/chat
Body: { sessionId, message, context }
Response: { reply, suggestions }
```

---

## Files

### Core Integration
- `server/maestra-client.ts` - Maestra API client (220 lines)
- `server/routes.ts` - API routes with real calls
- `server/index.ts` - Server setup with proper binding

### Documentation
- `MAESTRA_INTEGRATION.md` - Integration guide
- `REPLIT_DEPLOYMENT.md` - Deployment instructions
- `DEPLOYMENT_VERIFICATION.md` - Testing checklist
- `PHASE_3_COMPLETE.md` - Detailed completion report

### Configuration
- `.replit` - Replit configuration
- `.env.example` - Environment variables template
- `package.json` - Dependencies and scripts

---

## Environment Variables

```bash
MAESTRA_URL=http://localhost:8825  # Maestra backend URL
PORT=5000                          # Server port
HOST=127.0.0.1                     # Server host
NODE_ENV=development               # Environment
```

---

## Testing

### Local Integration Tests
```bash
# Run all tests
/tmp/test_integration.sh

# Test individual endpoints
curl http://127.0.0.1:5000/api/health
curl -X POST http://127.0.0.1:5000/api/pdf/import \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "fileData": "..."}'
```

### Deployment Verification
See `DEPLOYMENT_VERIFICATION.md` for complete checklist

---

## Performance

**Local Testing Results:**
- Health check: <100ms
- Smart PDF detection: <50ms
- Manifest extraction: ~200ms
- Maestra chat: ~1.5s
- Total flow: ~2s

**Expected on Replit:**
- Health check: <200ms
- Smart PDF detection: <100ms
- Manifest extraction: ~300ms
- Maestra chat: ~2-3s
- Total flow: ~3-4s

---

## Known Limitations

1. **Smart PDF Detection** - Filename-based only (can be enhanced with PDF attachment reading)
2. **Session Storage** - In-memory only (needs database for persistence)
3. **File Upload** - Not yet implemented
4. **PDF Regeneration** - Not yet implemented
5. **Authentication** - Not implemented
6. **Rate Limiting** - Not implemented

---

## Next Steps (Phase 3c)

### Frontend Features
- [ ] Drag-drop PDF upload
- [ ] PDF viewer with text selection
- [ ] Manifest display in sidebar
- [ ] Chat interface
- [ ] Rewrite suggestions
- [ ] Apply changes to PDF
- [ ] Export regenerated PDF
- [ ] Version history switching

### Backend Features
- [ ] PDF file upload handling
- [ ] PDF regeneration with changes
- [ ] Version history tracking
- [ ] Persistent storage (database)
- [ ] Authentication
- [ ] Rate limiting

---

## Deployment Options

### Option A: Separate Replit (Recommended)
- Companion on one Replit
- Maestra backend on separate Replit
- Independent scaling

### Option B: Same Replit
- Both services on same Replit
- Simpler setup
- Lower cost

### Option C: Local Maestra + Replit Companion
- Companion deployed to Replit
- Maestra runs locally
- Use ngrok/tunnel for API access

---

## Troubleshooting

### "Maestra disconnected"
- Check `MAESTRA_URL` environment variable
- Verify Maestra backend is running
- Test backend health: `curl $MAESTRA_URL/health`

### "Failed to import PDF"
- Ensure `fileData` is valid base64
- Check file size (should be < 10MB)
- Verify it's a valid PDF

### "Failed to process chat"
- Check Maestra backend logs
- Verify `/api/maestra/advisor/ask` endpoint exists
- Check request format matches schema

### Build fails with TypeScript errors
- Run `npm install`
- Clear node_modules: `rm -rf node_modules && npm install`
- Rebuild: `npm run build`

---

## Project Structure

```
smart-pdf-companion/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.tsx
│   └── index.html
├── server/                    # Express backend
│   ├── index.ts              # Server entry
│   ├── routes.ts             # API routes
│   ├── maestra-client.ts     # Maestra API client
│   ├── storage.ts            # Session storage
│   ├── static.ts             # Static file serving
│   └── vite.ts               # Vite dev server setup
├── shared/                    # Shared types
│   └── schema.ts             # Zod schemas
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
├── .replit                   # Replit config
├── .env.example              # Environment template
├── MAESTRA_INTEGRATION.md    # Integration guide
├── REPLIT_DEPLOYMENT.md      # Deployment guide
├── DEPLOYMENT_VERIFICATION.md # Testing checklist
└── PHASE_3_COMPLETE.md       # Completion report
```

---

## Development Workflow

1. **Make changes** to code
2. **Test locally** with `npm run dev`
3. **Commit** with `git commit -m "..."`
4. **Push** with `git push`
5. **Replit auto-deploys** from main branch
6. **Verify** at https://smart-pdf.8825.systems

---

## Key Technologies

- **Frontend:** React, TypeScript, Vite, Shadcn/ui, PDF.js
- **Backend:** Express.js, TypeScript, Zod
- **Integration:** Maestra API (FastAPI)
- **Deployment:** Replit, GitHub
- **Database:** PostgreSQL (future)

---

## Success Metrics

**Phase 3a (Maestra Integration):** ✅ Complete
- Real API calls working
- All integration tests passing
- Local deployment verified

**Phase 3b (Replit Deployment):** 🔄 Ready
- Deployment guides created
- Code pushed to GitHub
- Configuration complete
- Ready for Replit deployment

**Phase 3c (Frontend Features):** ⏳ Next
- Drag-drop upload
- PDF viewer
- Chat interface
- Rewrite flow

---

## Support

### Documentation
- `MAESTRA_INTEGRATION.md` - Integration details
- `REPLIT_DEPLOYMENT.md` - Deployment instructions
- `DEPLOYMENT_VERIFICATION.md` - Testing procedures
- `PHASE_3_COMPLETE.md` - Detailed report

### GitHub
- Repository: https://github.com/Jh-justinHarmon/smart-pdf.8825.systems
- Issues: Report bugs or request features
- Discussions: Ask questions or share ideas

### Local Development
- Maestra backend: http://localhost:8825
- Companion: http://127.0.0.1:5000
- Test script: `/tmp/test_integration.sh`

---

## License

Part of the 8825 Smart PDF project

---

**Last Updated:** December 22, 2025
**Phase:** 3 (Maestra Integration)
**Status:** Deployment Ready
