export interface Env {
  BACKEND_URL: string;
  BACKEND_FALLBACK_URL?: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
});

const isRetriableGatewayStatus = (status: number): boolean =>
  [522, 523, 524, 525, 526].includes(status);

const fetchWithFallback = async (
  primaryUrl: string,
  request: Request,
  env: Env
): Promise<Response> => {
  const primaryReq = new Request(primaryUrl, request);
  try {
    const primaryResp = await fetch(primaryReq);
    if (!env.BACKEND_FALLBACK_URL || !isRetriableGatewayStatus(primaryResp.status)) {
      return primaryResp;
    }
  } catch {
    if (!env.BACKEND_FALLBACK_URL) throw new Error('Primary backend request failed');
  }

  const fallbackBase = new URL(env.BACKEND_FALLBACK_URL);
  const primaryParsed = new URL(primaryUrl);
  fallbackBase.pathname = primaryParsed.pathname;
  fallbackBase.search = primaryParsed.search;
  const fallbackReq = new Request(fallbackBase.toString(), request);
  return fetch(fallbackReq);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) }); 
    }

    if (url.pathname === '/health') {
      const target = `${env.BACKEND_URL}/health`;
      const resp = await fetchWithFallback(target, new Request(request, { method: 'GET' }), env);
      const respHeaders = new Headers(resp.headers);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => respHeaders.set(k, v));
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    }

    if (url.pathname.startsWith('/uploads/')) {
      const target = `${env.BACKEND_URL}${url.pathname}${url.search || ''}`;
      const proxyReq = new Request(target, {
        method: request.method,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
        headers: request.headers,
      });
      const resp = await fetchWithFallback(target, proxyReq, env);
      const respHeaders = new Headers(resp.headers);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => respHeaders.set(k, v));
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    }

    if (url.pathname.startsWith('/api/')) {
      const target = new URL(env.BACKEND_URL);
      target.pathname = url.pathname.replace(/^\/api/, '/api');
      target.search = url.search;

      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('accept-encoding');

      const targetUrl = target.toString();
      const proxyReq = new Request(targetUrl, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
        redirect: 'follow',
      });

      const resp = await fetchWithFallback(targetUrl, proxyReq, env);
      const respHeaders = new Headers(resp.headers);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => respHeaders.set(k, v));
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    }

    try {
      const assetResp = await env.ASSETS.fetch(request);
      if (assetResp.status === 404) {
        const indexUrl = new URL('/index.html', url.origin);
        return env.ASSETS.fetch(new Request(indexUrl.toString(), request));     
      }
      return assetResp;
    } catch {
      return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
    }
  },
};
