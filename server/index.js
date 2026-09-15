import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Database } from './lib/database.js';
import { Workspace } from './lib/workspace.js';
import { Orchestrator } from './lib/orchestrator.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Hosted preview services route traffic to the process port.  Bind explicitly
// to all interfaces rather than Node's localhost-only default.
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const db = new Database(path.join(root, process.env.ALTREX_DATA_DIR || '.altrex', 'altrex.db'));
await db.initialize();
const workspace = new Workspace(path.join(root, process.env.ALTREX_DATA_DIR || '.altrex', 'workspaces'));
const orchestrator = new Orchestrator({ db, workspace });
const sessions = new Map();

function json(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
function getUser(req) { const token = (req.headers.cookie || '').match(/altrex_session=([^;]+)/)?.[1]; return token && sessions.get(token); }
function auth(req, res) { const user = getUser(req); if (!user) { json(res, 401, { error: 'Authentication required' }); return null; } return user; }
async function body(req) { let data = ''; for await (const c of req) { data += c; if (data.length > 1_000_000) throw new Error('Request too large'); } return data ? JSON.parse(data) : {}; }
function safeProject(projectId) { return db.project(projectId); }

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { status: 'ok', service: 'altrex-code' });
  if (req.method === 'POST' && url.pathname === '/api/auth/register') { const b = await body(req); if (!b.email || !b.password || b.password.length < 10) return json(res, 400, { error: 'Email and password (10+ chars) required' }); const user = await db.createUser(b.email, hash(b.password)); return json(res, 201, { user: { id: user.id, email: user.email } }); }
  if (req.method === 'POST' && url.pathname === '/api/auth/login') { const b = await body(req); const user = await db.userByEmail(b.email); if (!user || !timingSafeEqual(Buffer.from(user.password_hash), Buffer.from(hash(b.password || '')))) return json(res, 401, { error: 'Invalid credentials' }); const token = randomBytes(32).toString('hex'); sessions.set(token, { id: user.id, email: user.email }); res.setHeader('Set-Cookie', `altrex_session=${token}; HttpOnly; SameSite=Strict; Path=/`); return json(res, 200, { user: { id: user.id, email: user.email } }); }
  const user = auth(req, res); if (!user) return;
  if (req.method === 'GET' && url.pathname === '/api/projects') return json(res, 200, await db.projects(user.id));
  if (req.method === 'POST' && url.pathname === '/api/projects') { const b = await body(req); const project = await db.createProject(user.id, b.name || 'Untitled project', b.template || 'blank'); await workspace.create(project); return json(res, 201, project); }
  const match = url.pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/); if (!match) return json(res, 404, { error: 'Not found' });
  const [, id, action = ''] = match; const project = await safeProject(id); if (!project || project.user_id !== user.id) return json(res, 404, { error: 'Project not found' });
  if (req.method === 'GET' && action === '') return json(res, 200, project);
  if (req.method === 'GET' && action === 'files') return json(res, 200, await workspace.list(id));
  if (req.method === 'GET' && action === 'file') return json(res, 200, { path: url.searchParams.get('path'), content: await workspace.read(id, url.searchParams.get('path')) });
  if (req.method === 'PUT' && action === 'file') { const b = await body(req); await workspace.write(id, b.path, b.content); await db.audit(user.id, id, 'file.write', b.path); return json(res, 200, { ok: true }); }
  if (req.method === 'GET' && action === 'agents') return json(res, 200, await db.agents(id));
  if (req.method === 'GET' && action === 'tasks') return json(res, 200, await db.tasks(id));
  if (req.method === 'GET' && action === 'events') return json(res, 200, await db.events(id));
  if (req.method === 'POST' && action === 'requests') { const b = await body(req); const result = await orchestrator.run({ project, user, prompt: b.prompt }); return json(res, 202, result); }
  if (req.method === 'POST' && action === 'commands') { const b = await body(req); if (!b.approved) return json(res, 409, { error: 'Command requires explicit approval', approvalRequired: true }); const result = await workspace.command(id, b.command); await db.audit(user.id, id, 'command.run', b.command); return json(res, 200, result); }
  return json(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => { try { const url = new URL(req.url, `http://${req.headers.host}`); if (url.pathname.startsWith('/api/')) return await api(req, res, url); const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1); const target = path.resolve(root, 'public', file); if (!target.startsWith(path.join(root, 'public'))) return json(res, 403, { error: 'Forbidden' }); const data = await readFile(target); const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html'; res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }); res.end(data); } catch (error) { json(res, error.code === 'ENOENT' ? 404 : 500, { error: error.message }); } });
server.listen(port, host, () => console.log(`ALTREX CODE listening on http://${host}:${port}`));
