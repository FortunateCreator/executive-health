import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
});

const TARGETS = {
  web: { host: 'localhost', port: 3000 },
  corporate: { host: 'localhost', port: 3002 },
  ops: { host: 'localhost', port: 3003 },
};

function routeTarget(path) {
  if (path.startsWith('/corporate') || path.startsWith('/api/organizations'))
    return TARGETS.corporate;
  if (path.startsWith('/ops') || path.startsWith('/api/ops'))
    return TARGETS.ops;
  return TARGETS.web;
}

// Rewrite /corporate/* → /* for the B2B dashboard app
function rewritePath(path, target) {
  if (target === TARGETS.corporate && path.startsWith('/corporate')) {
    const rewritten = path.replace(/^\/corporate/, '') || '/';
    return rewritten;
  }
  return path;
}

process.noDeprecation = true;

proxy.on('error', (err, req, res) => {
  if (res && !res.headersSent) {
    try { res.writeHead(502); res.end('Bad Gateway'); } catch (_) {}
  }
});

// Forward original host header for correct redirect URL resolution
proxy.on('proxyReq', (proxyReq, req) => {
  if (req.headers?.host) {
    proxyReq.setHeader('x-forwarded-host', req.headers.host);
    proxyReq.setHeader('x-forwarded-proto', req.headers['x-forwarded-proto'] || 'http');
  }
});

const server = http.createServer((req, res) => {
  const target = routeTarget(req.url);
  const originalUrl = req.url;
  req.url = rewritePath(req.url, target);
  proxy.web(req, res, { target: `http://${target.host}:${target.port}` }, (err) => {
    req.url = originalUrl;
    if (!res.headersSent) {
      try { res.writeHead(502); res.end('Bad Gateway'); } catch (_) {}
    }
  });
});

server.on('upgrade', (req, socket, head) => {
  const target = routeTarget(req.url);
  req.url = rewritePath(req.url, target);
  proxy.ws(req, socket, head, { target: `http://${target.host}:${target.port}` }, (err) => {
    try { socket.destroy(); } catch (_) {}
  });
});

const PORT = 3005;
server.listen(PORT, () => {
  console.log(`Executive Health proxy → http://localhost:${PORT}`);
  console.log(`  /            → B2C Web      :${TARGETS.web.port}`);
  console.log(`  /corporate/* → B2B Dashboard :${TARGETS.corporate.port} (rewritten to /*)`);
  console.log(`  /ops/*       → Ops Internal  :${TARGETS.ops.port}`);
});
