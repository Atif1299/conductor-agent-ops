import type { ReactNode } from "react";
import Link from "next/link";
import { ShellNav } from "@/components/ShellNav";
import "./globals.css";

export const metadata = {
  title: "Conductor — Multi-Agent Orchestrator",
  description:
    "Operator control plane: Hermes + Claude Code path dual-stack over OpenRouter, MCP, human gates.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden />
              <span className="brand-text">
                <span className="brand-name">Conductor</span>
                <span className="brand-sub">operator</span>
              </span>
            </Link>
            <ShellNav />
            <div className="sidebar-footer">
              <p className="rule">
                Hermes plans.
                <br />
                Claude Code path executes.
                <br />
                Humans approve.
                <br />
                LLM: OpenRouter
              </p>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
