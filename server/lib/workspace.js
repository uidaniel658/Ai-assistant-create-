import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
const deny = /(^|\s)(rm\s+-rf|sudo|shutdown|reboot|mkfs|curl\s.*\|\s*(sh|bash)|chmod\s+777)(\s|$)/i;
export class Workspace {
  constructor(root) { this.root = root; }
  dir(id) { return path.join(this.root, id); }
  resolve(id, name) { if (typeof name !== 'string' || !name || name.includes('\0')) throw new Error('Invalid path'); const base = this.dir(id); const target = path.resolve(base, name); if (!target.startsWith(`${base}${path.sep}`) && target !== base) throw new Error('Path escapes workspace'); return target; }
  async create(project) { const dir = this.dir(project.id); await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'README.md'), `# ${project.name}\n\nCreated with ALTREX CODE.\n`); await writeFile(path.join(dir, '.gitignore'), 'node_modules/\n.env\n'); }
  async list(id, relative = '') { const dir = this.resolve(id, relative || '.'); const entries = await readdir(dir, { withFileTypes: true }); return Promise.all(entries.filter(e => !['node_modules', '.git'].includes(e.name)).map(async e => ({ path: path.join(relative, e.name), type: e.isDirectory() ? 'directory' : 'file', ...(e.isDirectory() ? { children: await this.list(id, path.join(relative, e.name)) } : {}) }))); }
  async read(id, name) { return readFile(this.resolve(id, name), 'utf8'); }
  async write(id, name, content) { const target = this.resolve(id, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, String(content), 'utf8'); }
  async command(id, command) { if (typeof command !== 'string' || command.length > 1000 || deny.test(command)) throw new Error('Command denied by workspace policy'); return new Promise((resolve) => { const child = spawn(command, { cwd: this.dir(id), shell: '/bin/bash', timeout: 120000, env: { PATH: process.env.PATH, HOME: this.dir(id), NODE_ENV: 'development' } }); let output = ''; child.stdout.on('data', d => output += d); child.stderr.on('data', d => output += d); child.on('close', code => resolve({ code, output: output.slice(-50000) })); child.on('error', e => resolve({ code: -1, output: e.message })); }); }
}
