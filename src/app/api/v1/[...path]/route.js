// Forwards /api/v1/* to the Java backend (replaces CRA's setupProxy.js).
// The backend CORS list doesn't include localhost, so in development the
// browser calls this app's own origin and the request is relayed from here.

import { ADMIN_API_URL } from "@/api/adminApiUrl";

// Full backend base path, ending in /api/v1.
const TARGET = (process.env.ADMIN_API_PROXY_TARGET || ADMIN_API_URL).replace(/\/$/, "");

// Hop-by-hop headers, plus ones fetch recomputes. Origin is dropped because
// Spring checks it on every request, not just preflights, and would 403.
const DROP_REQUEST = ["host", "origin", "referer", "connection", "content-length", "accept-encoding"];
// fetch has already decoded the body, so the original encoding/length no longer apply.
const DROP_RESPONSE = ["content-encoding", "content-length", "transfer-encoding", "connection"];

async function proxy(request, { params }) {
  const { path } = await params;
  const search = new URL(request.url).search;
  const url = `${TARGET}/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers(request.headers);
  DROP_REQUEST.forEach((name) => headers.delete(name));

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  DROP_RESPONSE.forEach((name) => responseHeaders.delete(name));
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const dynamic = "force-dynamic";
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
