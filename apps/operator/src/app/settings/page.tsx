"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/client";
import type { Settings } from "@conductor/contracts";

type SettingsResponse = {
  settings: Settings;
  runtime?: {
    openRouterConfigured?: boolean;
    gcsBucket?: string | null;
    publicUrl?: string | null;
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [runtime, setRuntime] = useState<SettingsResponse["runtime"]>();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SettingsResponse>("/api/settings")
      .then((d) => {
        setSettings(d.settings);
        setRuntime(d.runtime);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setMsg(null);
    setErr(null);
    try {
      const res = await apiPatch<{ settings: Settings }>("/api/settings", {
        bridgeHermes: settings.bridgeHermes,
        bridgeClaudeCode: settings.bridgeClaudeCode,
        channel: settings.channel,
        maxChildAgents: settings.maxChildAgents,
        budgetUsdPerDay: settings.budgetUsdPerDay,
        demoMode: settings.demoMode,
        llmProvider: settings.llmProvider,
        llmModel: settings.llmModel,
        codingRoleLabel: settings.codingRoleLabel,
      });
      setSettings(res.settings);
      setMsg("Saved. autoMergeMain remains false.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    }
  }

  if (!settings) {
    return (
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="panel-muted">{err ?? "Loading…"}</p>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Runtime policy</span>
          <h1>Settings</h1>
          <p>
            OpenRouter is the LLM fabric. Dual-stack roles stay Hermes + Claude
            Code path. Auto-merge to main remains off.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Runtime</h2>
        <p className="panel-muted mono">
          OpenRouter key:{" "}
          {runtime?.openRouterConfigured ? "present" : "not set on this host"}
          {runtime?.gcsBucket ? ` · GCS ${runtime.gcsBucket}` : " · local store"}
          {runtime?.publicUrl ? ` · ${runtime.publicUrl}` : ""}
        </p>
      </section>

      <section className="panel">
        <form className="form-grid" onSubmit={save}>
          <label>
            LLM provider
            <select
              value={settings.llmProvider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  llmProvider: e.target.value as Settings["llmProvider"],
                })
              }
            >
              <option value="openrouter">openrouter</option>
              <option value="openai">openai</option>
              <option value="none">none</option>
            </select>
          </label>
          <label>
            Model slug (OpenRouter)
            <input
              type="text"
              value={settings.llmModel}
              onChange={(e) =>
                setSettings({ ...settings, llmModel: e.target.value })
              }
            />
          </label>
          <label>
            Coding role label (UI)
            <input
              type="text"
              value={settings.codingRoleLabel}
              onChange={(e) =>
                setSettings({ ...settings, codingRoleLabel: e.target.value })
              }
            />
          </label>
          <label>
            Hermes bridge
            <select
              value={settings.bridgeHermes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bridgeHermes: e.target.value as Settings["bridgeHermes"],
                })
              }
            >
              <option value="connected">connected</option>
              <option value="degraded">degraded</option>
              <option value="offline">offline</option>
            </select>
          </label>
          <label>
            Claude Code path bridge
            <select
              value={settings.bridgeClaudeCode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bridgeClaudeCode: e.target
                    .value as Settings["bridgeClaudeCode"],
                })
              }
            >
              <option value="connected">connected</option>
              <option value="degraded">degraded</option>
              <option value="offline">offline</option>
            </select>
          </label>
          <label>
            Intake channel
            <select
              value={settings.channel}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  channel: e.target.value as Settings["channel"],
                })
              }
            >
              <option value="cli">cli</option>
              <option value="telegram">telegram</option>
              <option value="none">none</option>
            </select>
          </label>
          <label>
            Max child agents
            <input
              type="number"
              min={1}
              value={settings.maxChildAgents}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxChildAgents: Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            Budget USD / day
            <input
              type="number"
              min={0}
              step={1}
              value={settings.budgetUsdPerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  budgetUsdPerDay: Number(e.target.value),
                })
              }
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={settings.demoMode}
              onChange={(e) =>
                setSettings({ ...settings, demoMode: e.target.checked })
              }
            />
            Sample-board mode
          </label>
          <p className="panel-muted mono">autoMergeMain: false (enforced)</p>
          <div className="inline-actions">
            <button type="submit" className="btn primary">
              Save settings
            </button>
            {msg ? <span className="mono">{msg}</span> : null}
            {err ? <span className="error-text">{err}</span> : null}
          </div>
        </form>
      </section>
    </>
  );
}
