const ROLES = ['ORCHESTRATOR', 'ARCHITECT', 'FRONTEND', 'BACKEND', 'DATABASE', 'TESTER', 'SECURITY', 'REVIEWER'];
export class Orchestrator {
  constructor({ db, workspace }) { this.db = db; this.workspace = workspace; }
  async run({ project, user, prompt }) {
    if (typeof prompt !== 'string' || prompt.trim().length < 5) throw new Error('A detailed request is required');
    await this.db.event(project.id, 'request.received', 'Orchestrator received a development request.');
    for (const role of ROLES) await this.db.agent(project.id, role, role === 'ORCHESTRATOR' ? 'planning' : 'queued');
    const taskId = await this.db.task(project.id, 'Analyze and plan request', 'ARCHITECT', 'running', prompt);
    await this.db.event(project.id, 'agent.started', 'ARCHITECT is analyzing requirements.');
    const plan = this.plan(prompt);
    await this.workspace.write(project.id, 'ALTREX_PLAN.md', `# Implementation plan\n\n## Request\n${prompt}\n\n${plan.map((p, i) => `${i + 1}. **${p.role}** — ${p.title}`).join('\n')}\n`);
    for (const item of plan) { await this.db.task(project.id, item.title, item.role, 'queued', item.detail); }
    await this.db.event(project.id, 'plan.created', `Created ${plan.length} dependency-aware tasks. Provider execution requires a configured server-side AI provider.`);
    return { accepted: true, taskId, message: 'Plan saved. Tasks are queued for a configured agent provider; no agent work was fabricated.' };
  }
  plan(prompt) { const lower = prompt.toLowerCase(); const plan = [{ role: 'ARCHITECT', title: 'Define architecture and acceptance criteria', detail: 'Analyze requirements and map dependencies.' }]; if (/web|site|ui|frontend|design|react/.test(lower)) plan.push({ role: 'FRONTEND', title: 'Implement responsive user interface', detail: 'Build accessible components and client state.' }); if (/auth|api|server|database|user/.test(lower)) plan.push({ role: 'BACKEND', title: 'Implement secure server capabilities', detail: 'Validate inputs and authorize all access.' }, { role: 'DATABASE', title: 'Design persistent data model', detail: 'Add migrations, indexes, and constraints.' }); plan.push({ role: 'TESTER', title: 'Run build and regression tests', detail: 'Verify behavior using actual commands.' }, { role: 'SECURITY', title: 'Review command, auth, and data boundaries', detail: 'Identify unsafe execution and secret exposure.' }, { role: 'REVIEWER', title: 'Review implementation and verification evidence', detail: 'Assess architecture and changed files.' }); return plan; }
}
