# CORS Fix for Public Share Endpoint

## Problem
When accessing the public share page at `/share/{token}`, the frontend makes a fetch request to:
```
http://localhost:8000/monitors/shared/{token}?include_heartbeats=50
```

This was blocked by CORS policy with the error:
```
Access to fetch at 'http://localhost:8000/monitors/shared/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The CORS middleware in `backend/app/main.py` was configured with:
```python
allow_origins=["http://localhost:3000"]
```

This was too restrictive and didn't properly handle the public endpoint.

## Solution
Updated CORS configuration to allow all origins during development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

## Important Notes

### For Development:
- `allow_origins=["*"]` allows requests from any origin
- This is fine for local development
- Makes testing easier across different ports/domains

### For Production:
You should restrict CORS to specific domains:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

Or use environment variables:

```python
from app.core.config import get_settings

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),  # From .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

Then in `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## To Apply the Fix

### 1. Restart the Backend
The CORS middleware is configured at startup, so you need to restart the backend server:

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test the Share Feature
1. Go to http://localhost:3000/dashboard/monitors
2. Click ⋮ menu on a monitor
3. Click "SHARE_MONITOR"
4. Click "ENABLE_PUBLIC_SHARING"
5. Copy the share URL
6. Open the share URL in a new incognito window
7. Verify the monitor data loads without CORS errors

## Alternative Solutions

### Option 1: Proxy Through Next.js
Instead of calling the backend directly, proxy through Next.js:

**next.config.js:**
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};
```

**Frontend fetch:**
```typescript
const response = await fetch(`/api/monitors/shared/${token}?include_heartbeats=50`);
```

### Option 2: Use API Route Handler
Create a Next.js API route that fetches from the backend:

**app/api/share/[token]/route.ts:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const response = await fetch(
    `http://localhost:8000/monitors/shared/${params.token}?include_heartbeats=50`
  );
  const data = await response.json();
  return Response.json(data);
}
```

**Frontend fetch:**
```typescript
const response = await fetch(`/api/share/${token}`);
```

## Security Considerations

### Public Endpoint
The `/monitors/shared/{token}` endpoint is intentionally public:
- ✅ No authentication required
- ✅ Only returns data if `is_public=True`
- ✅ Uses secure random tokens (256-bit entropy)
- ✅ Returns 404 if sharing is disabled (not 403)

### CORS in Production
For production, you should:
1. ✅ Restrict `allow_origins` to your actual domains
2. ✅ Keep `allow_credentials=True` for authenticated endpoints
3. ✅ Consider rate limiting on public endpoints
4. ✅ Monitor for abuse of share tokens
5. ✅ Add logging for public endpoint access

## Files Changed
- `backend/app/main.py` - Updated CORS middleware configuration

## Testing Checklist
- [ ] Backend restarted with new CORS config
- [ ] Share modal opens and generates URL
- [ ] Share URL can be copied
- [ ] Opening share URL in new tab loads without CORS error
- [ ] Monitor data displays correctly on share page
- [ ] Heartbeat chart renders on share page
- [ ] Disabling sharing makes URL return 404
- [ ] Re-enabling sharing works with same token
