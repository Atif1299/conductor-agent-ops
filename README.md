<p align="center">
  <img src="docs/assets/conductor-banner.png" alt="Conductor" width="920" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Hermes-Orchestrator-111827?style=flat-square" alt="Hermes" />
  <img src="https://img.shields.io/badge/MCP-Tool%20fabric-0f172a?style=flat-square" alt="MCP" />
  <img src="https://img.shields.io/badge/GCP-Cloud%20Run%20%2B%20GCE-4285F4?style=flat-square&logo=googlecloud&logoColor=white" alt="GCP" />
</p>

<p align="center">
  <strong>Multi-Agent Orchestrator + Coding Agent control plane</strong><br/>
  <sub>Hermes plans &amp; verifies · coding agents execute · humans approve risk · no auto-merge to main</sub>
</p>

<p align="center">
  <a href="#what-is-conductor">Overview</a> ·
  <a href="#capabilities">Capabilities</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#project-layout">Layout</a>
</p>

---

## What is Conductor?

**Conductor** is an operator control plane for multi-agent engineering systems.

Most teams end up with loose chat sessions and no durable hand-off. Conductor separates roles and records them:

| Layer | Role |
|-------|------|
| **Orchestrator (Hermes)** | Memory, routing, delegation briefs, verification, status |
| **Coding agent** | Repo edits, tests, PR summary, file-level execution |
| **MCP fabric** | Shared tools between orchestrator and agents |
| **Human gates** | High-risk approval — **auto-merge to main is off** |

Positioning line for clients and hiring surfaces:

> Multi-Agent Orchestrator · Coding Agent (Hermes · multi-agent stack · MCP)

---

## Capabilities

- Kanban board with full task lifecycle  
- Structured **delegation briefs** (objective, criteria, boundaries, return format)  
- Approvals queue for high-risk work  
- Append-only **audit trail** of hand-offs  
- Intake API for CLI, cron, and orchestrator posts  
- Deployed operator on **Cloud Run**; always-on orchestrator host on **Compute Engine**

---

## Architecture

```
Intake  →  Hermes (orchestrator)
                 ↕️ MCP
           Coding agent path
                 ↓
         Conductor operator UI
                 ↓
           Human approval gate
```

**Rule:** Hermes plans and verifies. Coding agents execute. Humans approve risk.

---

## Quick start

```bash
git clone https://github.com/Atif1299/conductor-agent-ops.git
cd conductor-agent-ops
cp .env.example .env
npm install
npm run seed
npm run dev
```

Local operator: `http://localhost:3300`

| Script | Purpose |
|--------|---------|
| `deploy.ps1` | Deploy operator to Cloud Run |
| `infra/gce-hermes.ps1` | Provision / configure Hermes on GCE |

Secrets stay in environment / `.env` (never committed).

---

## Project layout

```
apps/operator/       Control plane UI + API (Next.js)
packages/contracts/  Shared schemas (brief, task, audit)
sample-target/       Coding scenario workspace
scenarios/           Brief fixtures
configs/             Hermes / MCP examples
infra/               GCE automation
docs/assets/         Brand assets
```

---

## Stack

| Area | Choice |
|------|--------|
| App | Next.js 15 · React 19 · TypeScript 5 |
| Orchestrator | Hermes Agent |
| Models | OpenRouter |
| Cloud | Google Cloud Run · Compute Engine |

---

## Production posture

- High-risk tasks require human approval  
- Control plane enforces **no auto-merge to main**  
- Optional GCS-backed durable store on Cloud Run  
- Keys only via env / secret stores  

---

## License

Portfolio / commercial use — contact the author.
