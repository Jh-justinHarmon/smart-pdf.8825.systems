# Deployment Verification Checklist

**Purpose:** Verify Smart PDF Companion is working correctly after deployment to Replit

---

## Pre-Deployment (Local)

- [x] Code compiles without errors
- [x] Dependencies installed (`npm install`)
- [x] Server starts (`npm run dev`)
- [x] Health check responds
- [x] Maestra backend running on port 8825
- [x] All integration tests passing

---

## Post-Deployment (Replit)

### 1. Server Health

**Test:** Health check endpoint
```bash
curl https://smart-pdf.8825.systems/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "maestra": "connected",
  "timestamp": "2025-12-22T..."
}
```

**Pass Criteria:**
- Status code: 200
- `status` = "ok"
- `maestra` = "connected"
- Response time < 500ms

### 2. Smart PDF Detection

**Test:** Upload Smart PDF
```bash
curl -X POST https://smart-pdf.8825.systems/api/pdf/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "clinic_intake_v3_smart.pdf",
    "fileData": "base64_encoded_data"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "fileName": "clinic_intake_v3_smart.pdf",
  "isSmartPdf": true,
  "manifest": { ... },
  "messages": []
}
```

**Pass Criteria:**
- Status code: 200
- `isSmartPdf` = true
- `manifest` is not null
- `id` is valid UUID
- Response time < 1s

### 3. Manifest Extraction

**Test:** Verify manifest data
```bash
curl https://smart-pdf.8825.systems/api/pdf/session/{session_id}
```

**Expected Response:**
```json
{
  "id": "...",
  "fileName": "clinic_intake_v3_smart.pdf",
  "isSmartPdf": true,
  "manifest": {
    "templateName": "Clinic Patient Intake Form",
    "templateType": "form",
    "version": "3",
    "sections": [ ... ],
    "versionHistory": [ ... ],
    "permissions": { ... },
    "security": { ... }
  }
}
```

**Pass Criteria:**
- Status code: 200
- All manifest fields present
- Sections array not empty
- Version history has entries
- Response time < 500ms

### 4. Chat Integration

**Test:** Send message to Maestra
```bash
curl -X POST https://smart-pdf.8825.systems/api/maestra/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_id",
    "message": "Can you help me rewrite this form?",
    "context": "Patient intake form"
  }'
```

**Expected Response:**
```json
{
  "reply": "Based on 8825 knowledge...",
  "suggestions": [
    { "id": "sug-...", "text": "..." },
    { "id": "sug-...", "text": "..." }
  ]
}
```

**Pass Criteria:**
- Status code: 200
- `reply` is not empty
- `reply` contains meaningful content (not error message)
- `suggestions` array has 1-3 items
- Response time < 3s

### 5. Session Management

**Test:** Update session
```bash
curl -X PATCH https://smart-pdf.8825.systems/api/pdf/session/{session_id} \
  -H "Content-Type: application/json" \
  -d '{ "currentPage": 2, "zoom": 150 }'
```

**Expected Response:**
```json
{
  "id": "...",
  "currentPage": 2,
  "zoom": 150,
  ...
}
```

**Pass Criteria:**
- Status code: 200
- `currentPage` updated to 2
- `zoom` updated to 150
- Response time < 500ms

---

## Performance Benchmarks

### Expected Response Times (Replit)

| Endpoint | Target | Acceptable | Slow |
|----------|--------|-----------|------|
| Health check | <200ms | <500ms | >1s |
| PDF import | <500ms | <1s | >2s |
| Get session | <300ms | <500ms | >1s |
| Update session | <300ms | <500ms | >1s |
| Chat | <2s | <3s | >5s |

### Load Testing

**Test:** Concurrent requests
```bash
# Send 10 concurrent health checks
for i in {1..10}; do
  curl -s https://smart-pdf.8825.systems/api/health &
done
wait
```

**Pass Criteria:**
- All requests succeed (status 200)
- No timeouts
- Response times consistent

---

## Error Handling

### Test: Invalid Request

**Test:** Missing required field
```bash
curl -X POST https://smart-pdf.8825.systems/api/pdf/import \
  -H "Content-Type: application/json" \
  -d '{ "fileName": "test.pdf" }'
```

**Expected Response:**
```json
{
  "error": "Invalid request",
  "details": [ ... ]
}
```

**Pass Criteria:**
- Status code: 400
- Error message is clear
- Details explain what's missing

### Test: Not Found

**Test:** Non-existent session
```bash
curl https://smart-pdf.8825.systems/api/pdf/session/invalid-id
```

**Expected Response:**
```json
{ "error": "Session not found" }
```

**Pass Criteria:**
- Status code: 404
- Error message is clear

### Test: Server Error

**Test:** Maestra backend disconnected
```bash
# Stop Maestra backend, then:
curl https://smart-pdf.8825.systems/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "maestra": "disconnected",
  "timestamp": "..."
}
```

**Pass Criteria:**
- Status code: 200 (health check itself succeeds)
- `maestra` = "disconnected"
- No 500 errors

---

## Browser Testing

### 1. Load Frontend

**Test:** Open in browser
```
https://smart-pdf.8825.systems
```

**Pass Criteria:**
- Page loads without errors
- No console errors
- UI is responsive
- All buttons/controls visible

### 2. Check Network Requests

**Test:** Open DevTools → Network tab
```
https://smart-pdf.8825.systems
```

**Pass Criteria:**
- All API requests succeed (status 200)
- No failed requests
- Response times reasonable
- No CORS errors

### 3. Test API Calls

**Test:** Open DevTools → Console
```javascript
// Health check
fetch('/api/health').then(r => r.json()).then(console.log)

// Get session (use real session ID)
fetch('/api/pdf/session/session-id').then(r => r.json()).then(console.log)
```

**Pass Criteria:**
- Requests complete without errors
- Responses are valid JSON
- Data matches expected schema

---

## Monitoring

### Logs

**Check Replit console for:**
- Server startup message: "serving on 127.0.0.1:5000"
- API request logs (should show requests)
- No error messages
- No warnings

### Metrics to Track

- Response times (should be consistent)
- Error rates (should be <1%)
- Maestra connectivity (should be "connected")
- Session creation rate (should be steady)

---

## Rollback Plan

If deployment fails:

1. **Check Replit logs** for error messages
2. **Verify environment variables** are set correctly
3. **Check Maestra backend** is running
4. **Restart Replit project** (Stop → Run)
5. **Revert to previous commit** if needed:
   ```bash
   git revert HEAD
   git push
   ```

---

## Success Criteria

**Deployment is successful if:**
- ✅ Health check passes
- ✅ Smart PDF detection works
- ✅ Manifest extraction works
- ✅ Chat integration works
- ✅ Session management works
- ✅ Error handling works
- ✅ Performance is acceptable
- ✅ No console errors
- ✅ No CORS errors
- ✅ Maestra backend connected

---

## Next Steps After Verification

1. **Monitor for 24 hours** - Check logs for errors
2. **Test with real users** - Get feedback on UX
3. **Implement Phase 3c features** - Drag-drop, rewrite, export
4. **Add analytics** - Track usage patterns
5. **Scale if needed** - Upgrade Replit plan if necessary

---

**Verification Status:** Ready to deploy
