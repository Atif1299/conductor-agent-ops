# Scenario 01 — Bugfix delegation

## Intake (as if Telegram)

> “Invoice webhook is flaky — add retry + logging and open a PR. Don’t touch billing migrations.”

## Flow

1. Hermes accepts task → creates card → writes delegation brief  
2. Claude Code works in `sample-target/`  
3. First test run may fail (intentional bug)  
4. Claude Code patches → tests pass  
5. Hermes marks `needs_human` (high risk / merge gate)  
6. Human approves in Operator UI  
7. Status → `done` (still no auto-merge)

## Proof artifacts

- `docs/proof/audit-bugfix.json` (sim)  
- Worker result: files + PR summary
