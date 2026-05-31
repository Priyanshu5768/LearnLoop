require('dotenv').config();

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const url     = require('url');

const sessions    = require('./sessions');
const authRoutes  = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const exchRoutes  = require('./routes/exchange');
const msgRoutes   = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const resourceRoutes = require('./routes/resources');
const gamifyRoutes = require('./routes/gamify');

const PORT      = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ── MIME types for static file serving ──────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Helper: parse JSON request body 
function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk.toString()));
    req.on('end', () => {
      try   { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
  });
}

// Helper: read session from cookie
function getSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/session_id=([^;]+)/);
  if (match && sessions[match[1]]) {
    return { id: match[1], data: sessions[match[1]] };
  }
  return null;
}

// ── Helper: send a simple JSON response ─────────────────────────────────────
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Helper: serve a static file ─────────────────────────────────────────────
function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h2>404 – Page Not Found</h2>');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}

// ── Main server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method   = req.method.toUpperCase();

  // CORS headers (useful if PHP/other clients call this API)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── API Routes ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const body    = await parseBody(req);
    const session = getSession(req);
    const ctx     = { req, res, body, session, query: parsed.query };

    try {
      if (pathname.startsWith('/api/auth/')) {
        const sub = pathname.replace('/api/auth', '');
        return await authRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/skills')) {
        const sub = pathname.replace('/api/skills', '') || '/';
        return await skillRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/exchange')) {
        const sub = pathname.replace('/api/exchange', '') || '/';
        return await exchRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/messages')) {
        const sub = pathname.replace('/api/messages', '') || '/';
        return await msgRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/reviews')) {
        const sub = pathname.replace('/api/reviews', '') || '/';
        return await reviewRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/resources')) {
        const sub = pathname.replace('/api/resources', '') || '/';
        return await resourceRoutes(ctx, sub, method);
      }
      if (pathname.startsWith('/api/gamify')) {
        const sub = pathname.replace('/api/gamify', '') || '/';
        return await gamifyRoutes(ctx, sub, method);
      }
    } catch (err) {
      console.error('[server]', err);
      return sendJSON(res, 500, { error: 'Internal server error.' });
    }

    return sendJSON(res, 404, { error: 'API endpoint not found.' });
  }

  // ── Static file serving from /public ─────────────────────────────────────
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // If the path has no extension, try appending .html (nice URLs)
  if (!path.extname(filePath)) filePath += '.html';

  serveFile(res, filePath);
});

// ── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n  ✦ Learn Loop is running at http://localhost:${PORT}`);
  console.log(`  ✦ Open http://localhost:${PORT} in your browser\n`);
});
