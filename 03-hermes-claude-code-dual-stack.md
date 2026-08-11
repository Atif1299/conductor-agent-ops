# Demo 3 — Hermes + Claude Code Dual-Stack (Portfolio Hero)

**Client-facing title:** Multi-Agent Orchestrator + Coding Agent Stack (Hermes · Claude Code · MCP)  
**Internal name:** Dual-stack always-on orchestrator + code worker  
**Stack:** Hermes Agent (orchestrator) · Claude Code (executor) · MCP bridge · optional Telegram/Slack · VPS or local Docker  
**Demo length target:** 2–3 minute architecture Loom (this one is “wow” if clean)  

---

## 1. Problem

Serious teams do not want:

- One chat window that forgets context  
- A coding agent that has no long-running ops brain  
- Humans manually bouncing tasks between Telegram, GitHub, and IDE  

They want:

1. **Always-on orchestrator** that receives work (message, cron, board)  
2. **Specialist coders** that can change a repo with verification  
3. Clear **hand-off contracts** (delegation briefs, done criteria)  

Without orchestration, “multi-agent” is just multiple chat tabs.

---

## 2. Why this demo matters

2026 narrative at good AI firms:

- Orchestrator holds memory, schedule, messaging, task board  
- Coding agent holds repo context and implements  
- MCP is the shared tool fabric  

Showing Hermes + Claude Code (or equivalent dual-stack) proves you follow modern agent systems thinking — not 2023 “one LLM app.”

**Caution for Upwork title:** clients rarely search “Hermes.” Market as **orchestrator + coding agent + MCP**. Hermes is the implementation.

---

## 3. Product vision

**Day in the life of the system:**

1. You message: “Add retry + logging to invoice webhook; open PR.”  
2. Hermes accepts task, creates kanban card, writes delegation brief  
3. Claude Code implements, runs tests, proposes PR summary  
4. Hermes reports status back to Slack/Telegram  
5. Human approves merge (gated)  

It feels like a tiny AI engineering department.

---

## 4. Role split (critical design)

| Layer | Owner | Responsibility | Weakness alone |
|-------|--------|----------------|----------------|
| Orchestrator | Hermes | Memory, channels, cron, routing, verification gates | Not ideal deep repo editor |
| Coding agent | Claude Code | Code edits, tests, repo navigation | Not always-on ops brain |
| Tool fabric | MCP | Shared tools both sides can call | Needs design discipline |

**Golden rule to emphasize in demos:**  
*Hermes plans and verifies. Claude Code executes code. Humans approve risk.*

---

## 5. Functionalities (target build)

### A. Always-on Hermes
- Runs locally **or** Docker/VPS  
- Receives tasks from chat channel (Telegram/Slack — even one is enough)  
- Persistent memory across sessions  
- Cron: e.g. “daily dependency outdated report” optional  

### B. Delegation brief format (this is product gold)
Every card must include:

- Objective (1 sentence)  
- Why it matters  
- Done criteria (tests pass / file X exists / API returns 200)  
- Boundaries (do not touch billing, do not migrate DB)  
- Return format (summary + risks)  

### C. Claude Code worker path
- Receives brief  
- Works in git worktree if possible  
- Runs test command  
- Returns PR description + file list  

### D. MCP bidirectional bridge (hero feature)
- Hermes can call coding-related tools / status  
- Claude Code can call Hermes tools (message channel, add board notes) if configured  
- Document **exactly** how you wired this (firms love this depth)  

### E. Safety gates
- No auto-merge to main  
- High-risk skills require human confirm  
- Budget / max child agents config  
- Full audit log of delegations  

### F. Operator UI (minimum)
- Even a Markdown dashboard of cards is fine  
- Status: queued · working · needs human · done · failed  

---

## 6. Problems this resolves for companies

- Founder cannot babysit every coding session  
- Night / async work needs a standing orchestrator  
- Agents need **memory and scheduling**, not only generation  
- Engineering orgs want separation: planning vs execution  

---

## 7. Demo scenarios (pick 2 for portfolio)

1. **Bugfix delegation:** error text → Hermes → Claude Code patch → failed tests → fixed → reported  
2. **Research + implement:** Hermes researches API docs → writes brief → Claude Code implements thin client  
3. **Cron hygiene:** nightly “open TODO comments report” (shows always-on)  

---

## 8. “Amazing work” presentation package

- One architecture diagram (orchestrator / worker / MCP / human)  
- Live config snippets (redacted)  
- Failure story (“what broke in SSH tunnel” if real — honesty builds trust)  
- Comparison table: single-agent ChatGPT vs dual-stack  
- Section: production roadmap (multi-repo, policy engine, cost routing)  

---

## 9. Risks / honesty notes for hiring

Say out loud:

- Hermes ecosystem moves fast; pin versions  
- Local laptop workers sleep; VPS runner needed for true always-on coding  
- Dual-stack is orchestration skill first, not “install two tools”  

That honesty signals senior judgment.

---

## 10. Scope for portfolio MVP

**In:** Hermes + Claude Code + 1 channel + 3 sample tasks + MCP bridge doc + audit logs  
**Out:** Full enterprise multi-tenant agent platform  

Enough to look exceptional; small enough to finish.

---

## 11. Deliverables checklist

- [ ] Running dual-stack setup doc  
- [ ] Sample delegation briefs committed  
- [ ] Audit log of a real completed task  
- [ ] Architecture SVG/PNG  
- [ ] Loom titled for clients (not “Hermes tutorial only”)  
- [ ] README: when to use dual-stack vs single agent  

---

## 12. Why this can be your portfolio hero

Few freelancers show **role-separated agent systems with verification**.  
Most show chatbots. You show **org design for machines**.
