import { NextRequest, NextResponse } from "next/server";

/**
 * BFF proxy: same-origin /api/v1 → FastAPI on Render.
 *
 * Replaces next.config rewrites for this path so OAuth works:
 * fetch() must use redirect: "manual" — if the proxy follows 302 redirects,
 * the browser never sees Set-Cookie from /auth/callback and stays logged out.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

/**
 * Node fetch decompresses gzip/br bodies but keeps Content-Encoding on the Response.
 * Forwarding those headers with the decompressed stream causes ERR_CONTENT_DECODING_FAILED.
 */
const STRIP_FROM_UPSTREAM_RESPONSE = new Set([
  "content-encoding",
  "content-length",
]);

function backendBase(): string | null {
  const raw =
    process.env.BACKEND_INTERNAL_URL?.trim() || "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "") || null;
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const out = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host") return;
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "accept-encoding") return;
    out.append(key, value);
  });
  const host = request.headers.get("host");
  if (host) {
    out.set("x-forwarded-host", host);
    out.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  }
  // Ask origin for uncompressed bytes so Node fetch + our stream match any encoding headers.
  out.set("accept-encoding", "identity");
  return out;
}

function copyResponseHeaders(from: Response, to: Headers): void {
  from.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (STRIP_FROM_UPSTREAM_RESPONSE.has(lower)) return;
    if (lower === "set-cookie") return;
    to.append(key, value);
  });
}

async function proxy(
  request: NextRequest,
  pathSegments: string[] | undefined,
): Promise<Response> {
  const backend = backendBase();
  if (!backend) {
    return NextResponse.json(
      { error: "BACKEND_INTERNAL_URL is not configured" },
      { status: 500 },
    );
  }

  const pathStr = pathSegments?.length ? pathSegments.join("/") : "";
  const path = pathStr ? `/${pathStr}` : "";
  
  // The backend has mixed routing:
  // - /monitors/, /auth/ → no /api prefix
  // - /admin/, /status-pages/, /notifications/, /export/ → /api prefix
  // So we need to add /api back for those routes
  const needsApiPrefix = pathStr.startsWith("admin/") || 
                         pathStr.startsWith("status-pages/") || 
                         pathStr.startsWith("notifications/") ||
                         pathStr.startsWith("export/") ||
                         pathStr.startsWith("heartbeats/");
  
  const finalPath = needsApiPrefix ? `/api${path}` : path;
  const target = `${backend}${finalPath}${request.nextUrl.search}`;

  const headers = forwardRequestHeaders(request);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
    Object.assign(init, { duplex: "half" as const });
  }

  const res = await fetch(target, init);

  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];

  const responseHeaders = new Headers();
  copyResponseHeaders(res, responseHeaders);
  for (const c of setCookies) {
    responseHeaders.append("set-cookie", c);
  }

  // Build a fresh response to prevent encoded-body/header mismatches.
  if (
    request.method === "HEAD" ||
    res.status === 204 ||
    res.status === 205 ||
    res.status === 304
  ) {
    return new NextResponse(null, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function OPTIONS(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function HEAD(
  request: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
