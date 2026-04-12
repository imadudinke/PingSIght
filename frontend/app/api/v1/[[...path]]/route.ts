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
    out.append(key, value);
  });
  const host = request.headers.get("host");
  if (host) {
    out.set("x-forwarded-host", host);
    out.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  }
  return out;
}

function copyResponseHeaders(
  from: Response,
  to: NextResponse,
  setCookies: string[],
): void {
  from.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP.has(lower)) return;
    to.headers.append(key, value);
  });
  for (const c of setCookies) {
    to.headers.append("set-cookie", c);
  }
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
  const target = `${backend}${path}${request.nextUrl.search}`;

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

  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  });
  copyResponseHeaders(res, out, setCookies);
  return out;
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
