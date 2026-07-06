import type { NextRequest } from "next/server";

const backendBaseUrl = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const hopByHopHeaders = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
] as const;

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export const dynamic = "force-dynamic";

const buildTargetUrl = (request: NextRequest, path: string[]): URL => {
  const targetUrl = new URL(`/api/${path.join("/")}`, backendBaseUrl);
  targetUrl.search = request.nextUrl.search;
  return targetUrl;
};

const buildRequestHeaders = (request: NextRequest): Headers => {
  const headers = new Headers(request.headers);

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }

  return headers;
};

const buildResponseHeaders = (sourceHeaders: Headers): Headers => {
  const headers = new Headers();
  const sourceSetCookies =
    "getSetCookie" in sourceHeaders && typeof sourceHeaders.getSetCookie === "function"
      ? sourceHeaders.getSetCookie()
      : [];

  sourceHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    headers.append(key, value);
  });

  for (const cookie of sourceSetCookies) {
    headers.append("set-cookie", cookie);
  }

  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> => {
  const { path } = await params;
  const upstreamResponse = await fetch(buildTargetUrl(request, path), {
    method: request.method,
    headers: buildRequestHeaders(request),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    cache: "no-store",
    redirect: "manual",
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: buildResponseHeaders(upstreamResponse.headers),
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
