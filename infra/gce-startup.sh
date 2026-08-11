#!/bin/bash
# GCE startup: Hermes install + free OpenRouter + Conductor bridge
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

meta() {
  curl -sf -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/attributes/$1" 2>/dev/null || true
}

OR_KEY="$(meta OPENROUTER_API_KEY)"
COND_URL="$(meta CONDUCTOR_PUBLIC_URL)"
COND_KEY="$(meta CONDUCTOR_API_KEY)"
OR_MODEL="$(meta OPENROUTER_MODEL)"
[ -z "$OR_MODEL" ] && OR_MODEL="openrouter/free"
[ -z "$COND_URL" ] && COND_URL="https://conductor-operator-95044197271.asia-south1.run.app"

log() { echo "[conductor-hermes] $*"; }

apt-get update -y
apt-get install -y curl ca-certificates git jq

export PATH="/usr/local/lib/hermes-agent/venv/bin:/.hermes/bin:/root/.local/bin:/usr/local/bin:$PATH"

if ! command -v hermes >/dev/null 2>&1 && [ ! -x /usr/local/lib/hermes-agent/venv/bin/hermes ]; then
  log "Installing Hermes Agent..."
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash || true
fi

HERMES_BIN="$(command -v hermes || true)"
[ -z "$HERMES_BIN" ] && [ -x /usr/local/lib/hermes-agent/venv/bin/hermes ] && HERMES_BIN=/usr/local/lib/hermes-agent/venv/bin/hermes

mkdir -p /root/.hermes /opt/conductor /.hermes
cat > /root/.hermes/.env <<EOF
OPENROUTER_API_KEY=${OR_KEY}
CONDUCTOR_PUBLIC_URL=${COND_URL}
CONDUCTOR_API_KEY=${COND_KEY}
EOF
chmod 600 /root/.hermes/.env
cp /root/.hermes/.env /.hermes/.env

cat > /root/.hermes/config.yaml <<EOF
model:
  provider: openrouter
  default: ${OR_MODEL}
fallback_providers:
  - provider: openrouter
    model: openrouter/free
policy:
  auto_merge_main: false
  max_child_agents: 2
EOF
cp /root/.hermes/config.yaml /.hermes/config.yaml

cat > /opt/conductor/post-to-conductor.sh <<'BRIDGE'
#!/bin/bash
set -euo pipefail
set -a; source /root/.hermes/.env; set +a
MSG="${1:-Hermes GCE online | openrouter/free}"
curl -sS -X POST "${CONDUCTOR_PUBLIC_URL}/api/intake" \
  -H "content-type: application/json" \
  -H "X-Conductor-Key: ${CONDUCTOR_API_KEY}" \
  -d "$(jq -n --arg m "$MSG" '{message:$m,source:"cron",highRisk:false}')"
echo
BRIDGE
chmod +x /opt/conductor/post-to-conductor.sh

cat > /etc/systemd/system/conductor-hermes-bridge.service <<'UNIT'
[Unit]
Description=Conductor Hermes board bridge
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
EnvironmentFile=/root/.hermes/.env
ExecStart=/bin/bash -c 'while true; do /opt/conductor/post-to-conductor.sh "Hermes GCE online | free model openrouter/free" || true; sleep 3600; done'
Restart=always
RestartSec=20
[Install]
WantedBy=multi-user.target
UNIT

if [ -n "$HERMES_BIN" ]; then
  "$HERMES_BIN" config set OPENROUTER_API_KEY "$OR_KEY" 2>/dev/null || true
  cat > /etc/systemd/system/hermes-gateway.service <<UNIT
[Unit]
Description=Hermes Agent gateway
After=network-online.target
[Service]
Type=simple
EnvironmentFile=/root/.hermes/.env
Environment=HOME=/root
Environment=HERMES_HOME=/root/.hermes
Environment=PATH=/usr/local/lib/hermes-agent/venv/bin:/.hermes/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=${HERMES_BIN} gateway
Restart=always
RestartSec=20
[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable hermes-gateway.service
  systemctl restart hermes-gateway.service || true
fi

systemctl daemon-reload
systemctl enable conductor-hermes-bridge.service
systemctl restart conductor-hermes-bridge.service
/opt/conductor/post-to-conductor.sh "Hermes GCE boot | openrouter/free" || true
log "Startup finished HERMES_BIN=$HERMES_BIN"
