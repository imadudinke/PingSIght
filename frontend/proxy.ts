import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Authentication is validated server-side by backend endpoints.
  // We do not gate dashboard pages in proxy because auth cookies
  // can be scoped to the backend origin and won't always exist on Next requests.
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
