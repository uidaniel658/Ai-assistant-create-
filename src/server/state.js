export const agents = [
  { id: 'architect', name: 'Architect Agent', role: 'Designs architecture and project boundaries', status: 'active' },
  { id: 'planner', name: 'Planner Agent', role: 'Breaks ideas into verifiable milestones', status: 'active' },
  { id: 'frontend', name: 'Frontend Agent', role: 'Builds app, IDE, and website experiences', status: 'ready' },
  { id: 'backend', name: 'Backend Agent', role: 'Creates APIs, workers, and orchestration services', status: 'ready' },
  { id: 'mobile', name: 'Mobile Agent', role: 'Builds Flutter, Kotlin, Swift, and React Native apps', status: 'ready' },
  { id: 'security', name: 'Security Agent', role: 'Audits secrets, auth, XSS, CSRF, and dependency risk', status: 'review' },
  { id: 'test', name: 'Test Agent', role: 'Runs unit, integration, E2E, type, lint, and build checks', status: 'ready' },
  { id: 'release', name: 'Release Agent', role: 'Packages APK, AAB, ZIP, reports, and changelogs', status: 'ready' },
];

export const providers = [
  { id: 'local', name: 'Local Models', endpoint: 'Ollama / llama.cpp', priority: 'Free-first', status: 'online', capabilities: ['code', 'planning', 'review'] },
  { id: 'openai-compatible', name: 'OpenAI-compatible', endpoint: 'User API key', priority: 'High reasoning', status: 'not_configured', capabilities: ['reasoning', 'agents', 'vision'] },
  { id: 'gemini-compatible', name: 'Gemini-compatible', endpoint: 'User API key', priority: 'Long context', status: 'not_configured', capabilities: ['long-context', 'vision'] },
  { id: 'anthropic-compatible', name: 'Anthropic-compatible', endpoint: 'User API key', priority: 'Review & safety', status: 'not_configured', capabilities: ['review', 'safety'] },
  { id: 'openrouter-compatible', name: 'OpenRouter-compatible', endpoint: 'User API key', priority: 'Model marketplace', status: 'not_configured', capabilities: ['routing', 'fallback'] },
];

export const artifacts = [
  { id: 'source-template', project: 'ALTREX CODE', version: '0.1.0', platform: 'web', type: 'Source ZIP', status: 'unverified', note: 'Packaging endpoint foundation is present; no source archive has been generated yet.' },
];

export const tasks = [];
export const events = [
  { id: 1, level: 'info', message: 'ALTREX backend booted', verified: true, createdAt: new Date().toISOString() },
];

let nextTaskId = 1;
let nextEventId = 2;

export function createTask(prompt) {
  const trimmed = String(prompt || '').trim();
  if (trimmed.length < 3) {
    const error = new Error('Task prompt must be at least 3 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const lower = trimmed.toLowerCase();
  const selectedAgents = agents.filter(agent => {
    if (lower.includes('apk') || lower.includes('android') || lower.includes('flutter')) return ['architect', 'planner', 'mobile', 'test', 'release', 'security'].includes(agent.id);
    if (lower.includes('api') || lower.includes('backend')) return ['architect', 'planner', 'backend', 'test', 'security'].includes(agent.id);
    if (lower.includes('bug') || lower.includes('fix')) return ['planner', 'test', 'security'].includes(agent.id);
    return ['architect', 'planner', 'frontend', 'backend', 'test'].includes(agent.id);
  });

  const task = {
    id: `task-${nextTaskId++}`,
    prompt: trimmed,
    status: 'planned',
    verification: 'UNVERIFIED',
    agents: selectedAgents.map(agent => agent.id),
    stages: ['Analyze', 'Plan', 'Generate', 'Build', 'Test', 'Fix', 'Rebuild', 'Verify', 'Package', 'Deliver'],
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(task);
  addEvent('task', `Created ${task.id}: ${trimmed}`, false);
  return task;
}

export function addEvent(level, message, verified = false) {
  const event = { id: nextEventId++, level, message, verified, createdAt: new Date().toISOString() };
  events.unshift(event);
  return event;
}
