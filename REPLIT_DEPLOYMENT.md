# Replit Deployment Guide

## Current Status

**Companion Code:** Pushed to GitHub (`main` branch)
**Replit Project:** https://replit.com/@JhJustinHarmon/smart-pdf-companion
**Live URL:** https://smart-pdf.8825.systems (when deployed)

---

## Deployment Strategy

### Option A: Maestra Backend on Separate Replit (Recommended)

**Pros:**
- Independent scaling
- Separate monitoring
- Can update each independently

**Steps:**
1. Create new Replit project from `8825_core/tools/maestra_backend`
2. Set `MAESTRA_URL` in companion to point to backend Replit
3. Deploy both

### Option B: Maestra Backend + Companion on Same Replit

**Pros:**
- Single deployment
- Simpler setup
- Lower cost

**Steps:**
1. Add Maestra backend code to companion Replit
2. Run both services on different ports
3. Set `MAESTRA_URL=http://localhost:8825`

### Option C: Local Maestra + Replit Companion (Current)

**Pros:**
- Test deployment without backend changes
- Keep backend local for development

**Steps:**
1. Deploy companion to Replit
2. Use ngrok/tunnel to expose local Maestra
3. Set `MAESTRA_URL` to ngrok URL

---

## Setup Instructions

### 1. Configure Environment Variables

In Replit Secrets:

```
MAESTRA_URL=http://localhost:8825  (or ngrok URL, or separate Replit)
PORT=5000
NODE_ENV=production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Server

```bash
npm run dev
```

Or for production:

```bash
npm run build && npm start
```

### 4. Verify Deployment

```bash
curl https://smart-pdf.8825.systems/api/health
```

Expected response:
```json
{
  "status": "ok",
  "maestra": "connected",
  "timestamp": "2025-12-22T..."
}
```

---

## Maestra Backend Deployment (Separate Replit)

### Create New Replit Project

1. Go to https://replit.com/new
2. Select "Python"
3. Clone from GitHub:
   ```
   https://github.com/Jh-justinHarmon/8825-systems.git
   ```
4. Set working directory to `8825_core/tools/maestra_backend`

### Configure

**Secrets:**
```
MAESTRA_PORT=8825
```

**Start Command:**
```bash
python3 server.py
```

### Get Public URL

Replit provides a public URL automatically. Use this as `MAESTRA_URL` in companion.

---

## Testing Deployment

### Health Check

```bash
curl https://smart-pdf.8825.systems/api/health
```

### Upload Smart PDF

```bash
curl -X POST https://smart-pdf.8825.systems/api/pdf/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "clinic_intake_v3_smart.pdf",
    "fileData": "base64_encoded_pdf_data"
  }'
```

### Chat with Maestra

```bash
curl -X POST https://smart-pdf.8825.systems/api/maestra/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-id",
    "message": "Can you help me rewrite this form?",
    "context": "Patient intake form"
  }'
```

---

## Troubleshooting

### "Maestra disconnected" in health check

**Cause:** Backend not running or URL incorrect
**Fix:** 
1. Check `MAESTRA_URL` in Replit Secrets
2. Verify backend Replit is running
3. Test backend health: `curl $MAESTRA_URL/health`

### "Failed to import PDF"

**Cause:** File path not accessible or invalid base64
**Fix:**
1. Ensure `fileData` is valid base64
2. Check file size (should be < 10MB)
3. Verify it's a valid PDF

### "Failed to process chat"

**Cause:** Maestra advisor endpoint error
**Fix:**
1. Check Maestra backend logs
2. Verify `/api/maestra/advisor/ask` endpoint exists
3. Check request format matches schema

### Build fails with TypeScript errors

**Cause:** Dependencies not installed
**Fix:** Run `npm install` and rebuild

---

## Performance & Scaling

**Current Limits:**
- Max file size: 10MB (configurable)
- Max concurrent sessions: 100 (in-memory storage)
- Chat response time: 1-2 seconds

**For Production:**
1. Add database (PostgreSQL) for persistent storage
2. Add Redis for session caching
3. Add rate limiting
4. Add authentication

---

## Monitoring

### Logs

Check Replit console for:
- Server startup messages
- API request logs
- Error messages

### Metrics

Monitor:
- Response times (should be <3s)
- Error rates (should be <1%)
- Maestra backend connectivity

---

## Next Steps

1. **Deploy Maestra Backend** (separate Replit or same)
2. **Deploy Companion** (push to Replit)
3. **Test Integration** (health check, upload, chat)
4. **Add Features** (drag-drop UI, rewrite, export)

---

## Files

- `server/index.ts` - Main server entry
- `server/routes.ts` - API routes
- `server/maestra-client.ts` - Maestra API client
- `package.json` - Dependencies
- `.env.example` - Environment variables template
- `MAESTRA_INTEGRATION.md` - Integration details

---

**Status:** Ready for deployment to Replit
