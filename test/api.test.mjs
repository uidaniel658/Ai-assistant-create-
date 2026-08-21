import test from 'node:test';
import assert from 'node:assert/strict';
import { createAltrexServer } from '../server.js';

async function withServer(fn) {
  const server = createAltrexServer();
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('health endpoint reports verified policy', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.verificationPolicy, 'VERIFIED_OR_UNVERIFIED_OR_FAILED');
  });
});

test('task endpoint creates an unverifed planned task with routed agents', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Build an Android AI assistant app' }),
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.task.status, 'planned');
    assert.equal(body.task.verification, 'UNVERIFIED');
    assert.ok(body.task.agents.includes('mobile'));
    assert.ok(body.task.agents.includes('release'));
  });
});

test('task endpoint rejects empty prompts', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '  ' }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /at least 3 characters/);
  });
});
