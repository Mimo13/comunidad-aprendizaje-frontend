// Combined dev server: serves Vite frontend and proxies /api to backend
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const app = express();

  // Proxy /api to backend
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    logLevel: 'warn',
    onProxyReq(proxyReq, req) {
      // forward cookies and headers
      if (req.headers.cookie) {
        proxyReq.setHeader('cookie', req.headers.cookie);
      }
    }
  }));
  
  // Vite dev server in middleware mode (after proxy so /api goes to backend)
  const vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  const PORT = 5173;
  app.listen(PORT, () => {
    console.log(`Combined dev server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
});
