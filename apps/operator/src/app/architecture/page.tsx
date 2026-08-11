export const dynamic = "force-dynamic";

export default function ArchitecturePage() {
  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Systems design</span>
          <h1>Architecture</h1>
          <p>
            Dual-stack org design: orchestrator memory and verification, coding
            specialist for repo work, MCP fabric, human risk gates. Models via
            OpenRouter.
          </p>
        </div>
      </header>

      <section className="panel arch">
        <div className="arch-row">
          <div className="arch-node">
            <strong>Intake</strong>
            <span>Telegram / CLI / cron into Hermes. Not the product UI.</span>
          </div>
          <div className="arch-node">
            <strong>Hermes</strong>
            <span>Memory, routing, board, briefs, verify. Provider: OpenRouter.</span>
          </div>
          <div className="arch-node">
            <strong>MCP bridge</strong>
            <span>Shared tool fabric — orchestrator ↔ coding path.</span>
          </div>
          <div className="arch-node">
            <strong>Claude Code path</strong>
            <span>Worktree, tests, PR body. Models via OpenRouter when live.</span>
          </div>
        </div>

        <div className="bridge-row">
          <div className="arch-node">
            <strong>Hermes → coder tools</strong>
            <span>Delegate brief, request status, pull test outcomes.</span>
          </div>
          <div className="bridge-line" aria-hidden />
          <div className="arch-node">
            <strong>Coder → Hermes tools</strong>
            <span>Board notes, channel message, escalate for human.</span>
          </div>
        </div>

        <div className="arch-node">
          <strong>Conductor operator</strong>
          <span>
            Control plane on Cloud Run (optional): board, briefs, approvals, audit.
            Humans approve risk; auto-merge stays false. Store: local or GCS.
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Golden rule</h2>
        <p className="panel-muted">
          Hermes plans and verifies. Claude Code path executes code. Humans approve
          risk. LLM transport is OpenRouter unless you later add Anthropic CLI
          auth for the official Claude Code binary.
        </p>
      </section>

      <section className="panel">
        <h2>Status machine</h2>
        <pre className="pre">{`queued → working → needs_human → done
                  ↘ failed ↗ (retry via queued)`}</pre>
      </section>
    </>
  );
}
