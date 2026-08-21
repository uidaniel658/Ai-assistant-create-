import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { artifacts, agents, createTask, events, providers, tasks } from './src/server/state.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', service: 'ALTREX CODE API', verificationPolicy: 'VERIFIED_OR_UNVERIFIED_OR_FAILED', time: new Date().toISOString() });
  }
  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    return sendJson(res, 200, { agents, providers, tasks, artifacts, events: events.slice(0, 20) });
  }
  if (req.method === 'GET' && url.pathname === '/api/agents') return sendJson(res, 200, { agents });
  if (req.method === 'GET' && url.pathname === '/api/providers') return sendJson(res, 200, { providers });
  if (req.method === 'GET' && url.pathname === '/api/tasks') return sendJson(res, 200, { tasks });
  if (req.method === 'POST' && url.pathname === '/api/tasks') {
    try {
      const body = await readJson(req);
      return sendJson(res, 201, { task: createTask(body.prompt) });
    } catch (error) {
      return sendJson(res, error.statusCode || 400, { error: error.message || 'Invalid JSON body.' });
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/events') return sendJson(res, 200, { events: events.slice(0, 50) });
  return sendJson(res, 404, { error: 'API route not found.' });
}

async function serveStatic(req, res, publicDir) {
  const url = new URL(req.url, 'http://localhost');
  let path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  path = normalize(path).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(publicDir, path);
  try {
    await readFile(filePath);
    res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

export function createAltrexServer({ publicDir = process.cwd() } = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
    return serveStatic(req, res, publicDir);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 5173);
  createAltrexServer().listen(port, () => console.log(`ALTREX CODE running at http://localhost:${port}`));
}
