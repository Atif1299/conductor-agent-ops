#!/bin/bash
# Complete Hermes + Conductor bridge config on GCE (idempotent)
set -euo pipefail

meta() {
  curl -s -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/attributes/$1" || true
}

OR_KEY="$(meta OPENROUTER_API_KEY)"
COND_URL="$(meta CONDUCTOR_PUBLIC_URL)"
COND_KEY="$(meta CONDUCTOR_API_KEY)"
OR_MODEL="$(meta OPENROUTER_MODEL)"
[ -z "$OR_MODEL" ] && OR_MODEL="openrouter/free"
[ -z "$COND_URL" ] && COND_URL="https://conductor-operator-95044197271.asia-south1.run.app"

export PATH="/usr/local/lib/hermes-agent/venv/bin:/.hermes/bin:/root/.local/bin:/usr/local/bin:$PATH"

# wait for hermes binary up to 10 min
HERMES_BIN=""
for i in $(seq 1 60); do
  if command -v hermes >/dev/null 2>&1; then
    HERMES_BIN="$(command -v hermes)"
    break
  fi
  for p in /usr/local/lib/hermes-agent/venv/bin/hermes /usr/local/bin/hermes /.hermes/hermes-agent/venv/bin/hermes; do
    if [ -x "$p" ]; then HERMES_BIN="$p"; break 2; fi
  done
  echo "waiting for hermes install... $i"
  sleep 10
done

echo "HERMES_BIN=${HERMES_BIN:-none}"
echo "OR_MODEL=$OR_MODEL COND_URL=$COND_URL key_len=${#OR_KEY}"

mkdir -p /root/.hermes /opt/conductor

cat > /root/.hermes/.env <<EOF
OPENROUTER_API_KEY=${OR_KEY}
CONDUCTOR_PUBLIC_URL=${COND_URL}
CONDUCTOR_API_KEY=${COND_KEY}
EOF
chmod 600 /root/.hermes/.env

# Also common hermes home
mkdir -p /.hermes
cp /root/.hermes/.env /.hermes/.env 2>/dev/null || true

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
cp /root/.hermes/config.yaml /.hermes/config.yaml 2>/dev/null || true

if [ -n "$HERMES_BIN" ]; then
  # Non-interactive model pin where supported
  "$HERMES_BIN" config set OPENROUTER_API_KEY "$OR_KEY" 2>/dev/null || true
  # try set model
  yes "" | "$HERMES_BIN" model 2>/dev/null || true
fi

apt-get install -y jq curl >/dev/null 2>&1 || true

cat > /opt/conductor/post-to-conductor.sh <<'BRIDGE'
#!/bin/bash
set -euo pipefail
# shellcheck disable=SC1091
set -a
source /root/.hermes/.env
set +a
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
User=root
EnvironmentFile=/root/.hermes/.env
ExecStart=/bin/bash -c 'while true; do /opt/conductor/post-to-conductor.sh "Hermes GCE online | free model openrouter/free" || true; sleep 3600; done'
Restart=always
RestartSec=20

[Install]
WantedBy=multi-user.target
UNIT

if [ -n "$HERMES_BIN" ]; then
  cat > /etc/systemd/system/hermes-gateway.service <<UNIT
[Unit]
Description=Hermes Agent gateway
After=network-online.target

[Service]
Type=simple
User=root
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

echo "POST intake..."
/opt/conductor/post-to-conductor.sh "Hermes GCE provision complete | openrouter/free" || true
systemctl is-active conductor-hermes-bridge.service
systemctl is-active hermes-gateway.service 2>/dev/null || echo "hermes-gateway not active yet"
echo DONE
