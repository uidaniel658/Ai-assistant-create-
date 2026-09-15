# ALTREX CODE

ALTREX CODE is a self-hosted, security-first control plane for autonomous software work. It provides persistent users, isolated project workspaces, a browser editor, activity/task telemetry, command approvals, and a real orchestration planning pipeline.

## Current implementation

- **Persistent SQLite storage** for users, projects, agent sessions, tasks, events, and audit logs.
- **Workspace isolation** with path traversal prevention, command policy enforcement, command timeout, and minimal child-process environment.
- **Real orchestration records**: requests create architecture, implementation, test, security, and review tasks in SQLite and save a project plan. It never reports invented agent progress.
- **Browser workspace**: project creation, file tree, actual file editing/saving, visible persisted agent/task/event activity, and an explicitly approved terminal action.
- **Authentication**: password hashes are stored server-side and an HttpOnly, SameSite cookie is used for the session. Configure a persistent session store before horizontally scaling.

## Run locally

```bash
cp .env.example .env
npm test
npm start
```

Open `http://localhost:3000`, create an account, and create a project. `npm run dev` starts Node in watch mode. Hosted environments can set `PORT`; the service defaults to `0.0.0.0:3000` so preview proxies can reach it.

## Production notes

Build an image with `docker build -t altrex-code .` and run it with a persistent `/data` volume. Set a strong `SESSION_SECRET`, configure TLS at a reverse proxy, and restrict the container network. Do not mount host paths into the application container; workspaces must remain isolated.

An AI-provider route is deliberately not implemented until tool-call and output schemas are selected and credential/configuration management is complete. Provider credentials must only ever be passed through server-side environment configuration.
