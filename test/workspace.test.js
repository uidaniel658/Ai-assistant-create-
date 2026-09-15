import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Workspace } from '../server/lib/workspace.js';
test('workspace prevents traversal and persists project files', async () => { const workspace = new Workspace(await mkdtemp(path.join(os.tmpdir(), 'altrex-'))); await workspace.create({ id: 'project', name: 'Test' }); await workspace.write('project', 'src/app.js', 'export const ok = true'); assert.equal(await workspace.read('project', 'src/app.js'), 'export const ok = true'); assert.throws(() => workspace.resolve('project', '../escape'), /escapes/); });
test('workspace blocks dangerous commands', async () => { const workspace = new Workspace(await mkdtemp(path.join(os.tmpdir(), 'altrex-'))); await workspace.create({ id: 'project', name: 'Test' }); await assert.rejects(workspace.command('project', 'rm -rf /tmp/nope'), /denied/); });
