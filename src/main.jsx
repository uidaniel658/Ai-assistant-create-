import './styles.css';

const buildStages = ['Understand', 'Plan', 'Delegate', 'Implement', 'Execute', 'Test', 'Debug', 'Review', 'Verify', 'Package', 'Download', 'Deploy'];
const icon = name => `<span class="icon" aria-hidden="true">${name}</span>`;
const capabilities = [
  ['⌘', 'AI IDE + App Builder', 'Generate React, Next.js, Flutter, Kotlin, Swift, Electron, Tauri, backend APIs, and SaaS projects from plain language.'],
  ['◎', 'ALTREX Swarm Engine', 'The orchestrator selects only the agents needed for each task, from compact 1–3 agent fixes to large multi-worker builds.'],
  ['◈', 'Dynamic Model Router', 'Prioritizes local, open-source, self-hosted, and user-key providers with task-specific model capability routing.'],
  ['▣', 'Real Build System', 'Runs dependency install, build, tests, repair loops, APK/AAB generation, and artifact packaging with verified status only.'],
  ['◆', 'Security + QA', 'Checks vulnerabilities, permissions, crashes, visual regressions, performance issues, and release readiness.'],
  ['⇩', 'Download Center', 'Delivers versioned APK, AAB, source ZIP, build logs, test reports, QR links, and changelogs.'],
];

const fallback = {
  agents: [], providers: [], tasks: [], artifacts: [], events: [],
};

function render(state = fallback) {
  const agents = state.agents || [];
  const providers = state.providers || [];
  const tasks = state.tasks || [];
  const artifacts = state.artifacts || [];
  const events = state.events || [];

  document.querySelector('#root').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">A</div><div><strong>ALTREX CODE</strong><span>AI engineering team</span></div></div>
        ${['New Task','Projects','Tasks','Agents','Swarm','Builds','Downloads','Git','Skills','Settings'].map((item, i) => `<button class="nav-item ${i === 0 ? 'active' : ''}">${item}</button>`).join('')}
      </aside>
      <main class="workspace">
        <section class="hero card">
          <div class="eyebrow">${icon('✦')} Build Faster. Think Deeper. Verify Everything.</div>
          <h1>ALTREX CODE</h1><p class="subtitle">Build. Test. Fix. Ship.</p>
          <form class="prompt-box" id="task-form"><input name="prompt" minlength="3" required value="Build an Android AI assistant app" aria-label="Task prompt"><button>${icon('▶')} Start verified build</button></form>
          <div class="quick-actions">${['Build App','Build Website','Fix Bugs','Create API','Review Code','Generate APK'].map(x => `<button data-prompt="${x}">${x}</button>`).join('')}</div>
          <p class="api-status" id="api-status">API foundation connected. Actions create real task records; build/APK execution remains UNVERIFIED until a worker runs it.</p>
        </section>
        <section class="grid two">
          <div class="card"><h2>${icon('▦')} Verified Build Flow</h2><div class="pipeline">${buildStages.map((stage, index) => `<div class="stage"><span>${String(index + 1).padStart(2,'0')}</span>${stage}</div>`).join('')}</div></div>
          <div class="card max-mode"><h2>${icon('⚡')} ALTREX MAX</h2><p>Deep planning, multi-agent swarm execution, multi-model reasoning, multiple solution paths, security review, performance review, visual QA, automated testing, auto-debugging, final judge, and final verification.</p><div class="truth-panel">${icon('✓')} Golden rule: never fake success. Results are marked VERIFIED, UNVERIFIED, or FAILED based on real execution.</div></div>
        </section>
        <section class="card"><h2>${icon('◉')} Platform Capabilities</h2><div class="capability-grid">${capabilities.map(([sym, title, text]) => `<article class="capability">${icon(sym)}<h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
        <section class="grid two">
          <div class="card"><h2>${icon('●')} Live Swarm</h2><div class="agents">${agents.map(agent => `<div class="agent"><div><strong>${agent.name}</strong><span>${agent.role}</span></div><em class="${agent.status}">${agent.status}</em></div>`).join('') || '<p class="muted">No agents loaded.</p>'}</div></div>
          <div class="card"><h2>${icon('◇')} Provider Manager</h2><div class="providers">${providers.map(provider => `<div class="provider"><strong>${provider.name}</strong><span>${provider.endpoint}</span><span>${provider.priority}</span><em>${provider.status}</em></div>`).join('') || '<p class="muted">No providers loaded.</p>'}</div></div>
        </section>
        <section class="grid two">
          <div class="card"><h2>${icon('☑')} Task Memory</h2><div class="tasks">${tasks.map(task => `<article class="task"><strong>${task.id}</strong><span>${task.prompt}</span><em>${task.verification}</em></article>`).join('') || '<p class="muted">Create a task to populate project memory.</p>'}</div></div>
          <div class="card"><h2>${icon('⇩')} Download Center</h2><div class="artifacts">${artifacts.map(artifact => `<article class="artifact"><strong>${artifact.project} ${artifact.version}</strong><span>${artifact.type} · ${artifact.platform}</span><em>${artifact.status}</em><small>${artifact.note}</small></article>`).join('')}</div></div>
        </section>
      </main>
      <aside class="right-panel"><h2>Control Plane</h2><div class="panel-card">${icon('▰')} Live terminal output, build logs, test status, and tool permission events stream here.</div><div class="panel-card">${icon('⑂')} Git checkpoints, commits, branches, pull requests, reviews, and release tags.</div><div class="panel-card">${icon('⇩')} Artifacts are only downloadable after real packaging completes.</div><h3>API Events</h3><div class="events">${events.map(event => `<div class="event"><span>${event.level}</span>${event.message}<em>${event.verified ? 'VERIFIED' : 'UNVERIFIED'}</em></div>`).join('')}</div></aside>
    </div>`;
  bindInteractions();
}

async function loadState() {
  const response = await fetch('/api/bootstrap');
  if (!response.ok) throw new Error(`API bootstrap failed: ${response.status}`);
  return response.json();
}

async function createTask(prompt) {
  const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Task creation failed.');
  return loadState();
}

function bindInteractions() {
  document.querySelector('#task-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = event.currentTarget.elements.prompt;
    document.querySelector('#api-status').textContent = 'Creating real task record through /api/tasks...';
    try {
      render(await createTask(input.value));
    } catch (error) {
      document.querySelector('#api-status').textContent = error.message;
    }
  });
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('[name="prompt"]').value = `${button.dataset.prompt}: `;
    document.querySelector('[name="prompt"]').focus();
  }));
}

loadState().then(render).catch(error => {
  render(fallback);
  document.querySelector('#api-status').textContent = `${error.message}. Static UI loaded, API state unavailable.`;
});
