import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
export class Database {
  constructor(file) { this.file = file; }
  async initialize() { await mkdir(path.dirname(this.file), { recursive: true }); this.db = new DatabaseSync(this.file); this.db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,template TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS agent_sessions(id TEXT PRIMARY KEY,project_id TEXT,role TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,project_id TEXT,title TEXT,role TEXT,status TEXT,detail TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,project_id TEXT,type TEXT,message TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS audit_logs(id TEXT PRIMARY KEY,user_id TEXT,project_id TEXT,action TEXT,detail TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)`); }
  async createUser(email, passwordHash) { const id = randomUUID(); this.db.prepare('INSERT INTO users(id,email,password_hash) VALUES(?,?,?)').run(id, email.toLowerCase(), passwordHash); return { id, email }; }
  async userByEmail(email) { return this.db.prepare('SELECT * FROM users WHERE email=?').get((email || '').toLowerCase()); }
  async projects(userId) { return this.db.prepare('SELECT * FROM projects WHERE user_id=? ORDER BY created_at DESC').all(userId); }
  async project(id) { return this.db.prepare('SELECT * FROM projects WHERE id=?').get(id); }
  async createProject(userId, name, template) { const id = randomUUID(); this.db.prepare('INSERT INTO projects(id,user_id,name,template) VALUES(?,?,?,?)').run(id, userId, name.slice(0, 100), template); return await this.project(id); }
  async event(projectId, type, message) { this.db.prepare('INSERT INTO events(id,project_id,type,message) VALUES(?,?,?,?)').run(randomUUID(), projectId, type, message); }
  async events(projectId) { return this.db.prepare('SELECT * FROM events WHERE project_id=? ORDER BY created_at DESC LIMIT 100').all(projectId); }
  async task(projectId, title, role, status, detail = '') { const id = randomUUID(); this.db.prepare('INSERT INTO tasks(id,project_id,title,role,status,detail) VALUES(?,?,?,?,?,?)').run(id, projectId, title, role, status, detail); return id; }
  async tasks(projectId) { return this.db.prepare('SELECT * FROM tasks WHERE project_id=? ORDER BY created_at DESC').all(projectId); }
  async agent(projectId, role, status) { this.db.prepare('INSERT INTO agent_sessions(id,project_id,role,status) VALUES(?,?,?,?)').run(randomUUID(), projectId, role, status); }
  async agents(projectId) { return this.db.prepare('SELECT role,status,created_at FROM agent_sessions WHERE project_id=? ORDER BY created_at DESC').all(projectId); }
  async audit(userId, projectId, action, detail) { this.db.prepare('INSERT INTO audit_logs(id,user_id,project_id,action,detail) VALUES(?,?,?,?,?)').run(randomUUID(), userId, projectId, action, detail.slice(0, 1000)); }
}
