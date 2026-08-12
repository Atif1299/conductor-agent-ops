# Where things run

| Piece | Runs on | URL / name |
|-------|---------|------------|
| **Conductor** (board you use) | Cloud Run | https://conductor-operator-95044197271.asia-south1.run.app |
| **Hermes** (always-on agent) | Compute Engine | `conductor-hermes` (asia-south1-a) |
| **LLM** | OpenRouter free | `openrouter/free` |

Browser → Conductor UI. Hermes (GCE) → OpenRouter free → Conductor intake API → board.
