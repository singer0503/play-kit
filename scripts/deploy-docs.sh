#!/usr/bin/env bash
# 部署 apps/docs 到 k3s server (play-kit-doc.bwinify.com)
#
# 用法：
#   K3S_SSH_PASS='xxx' ./scripts/deploy-docs.sh
#   或預先 export 環境變數，再裸跑 ./scripts/deploy-docs.sh
#
# 也可改用 SSH key（較推薦）：把 K3S_SSH_KEY 指到 private key 路徑即可，
# 這時 sshpass 會被略過。
#
# 必要環境：
#   - macOS / Linux 本地，pnpm 已裝
#   - 若用密碼，需先 brew install sshpass / apt install sshpass
#   - server 端已部署過 deploy/k8s/play-kit-doc.yaml
#
# 流程：
#   1. pnpm -C apps/docs build
#   2. strip sourcemap（公開站點不暴露原始碼）
#   3. tar 不帶 macOS xattr / resource fork
#   4. scp 到 /tmp/，extract 到 /srv/play-kit-doc/dist/
#   5. kubectl rollout restart 確保 nginx 重新載入
#   6. 驗證 https 200

set -euo pipefail

# ── 設定 ────────────────────────────────────────
SERVER="${K3S_SERVER:?需設定 K3S_SERVER 環境變數，例如 export K3S_SERVER=192.0.2.10}"
SSH_USER="${K3S_SSH_USER:-root}"
NAMESPACE="${K3S_NAMESPACE:-play-kit-doc}"
DEPLOY_NAME="${K3S_DEPLOY:-play-kit-doc}"
HOST_DIST_DIR="${K3S_HOST_DIST:-/srv/play-kit-doc/dist}"
DOMAIN="${K3S_DOMAIN:-play-kit-doc.bwinify.com}"
LOCAL_DIST="apps/docs/dist"
TARBALL="/tmp/play-kit-doc-dist-$$.tar.gz"

# ── SSH wrapper（key > password fallback）──────
if [[ -n "${K3S_SSH_KEY:-}" ]]; then
  SSH_CMD=(ssh -i "$K3S_SSH_KEY" -o StrictHostKeyChecking=no)
  SCP_CMD=(scp -i "$K3S_SSH_KEY" -o StrictHostKeyChecking=no)
elif [[ -n "${K3S_SSH_PASS:-}" ]]; then
  command -v sshpass >/dev/null 2>&1 || {
    echo "❌ 需要 sshpass。brew install sshpass 或改用 K3S_SSH_KEY"
    exit 1
  }
  SSH_CMD=(sshpass -p "$K3S_SSH_PASS" ssh -o StrictHostKeyChecking=no)
  SCP_CMD=(sshpass -p "$K3S_SSH_PASS" scp -o StrictHostKeyChecking=no)
else
  echo "❌ 請設定 K3S_SSH_KEY=<path> 或 K3S_SSH_PASS=<password>"
  exit 1
fi

ssh_run() { "${SSH_CMD[@]}" "${SSH_USER}@${SERVER}" "$@"; }
scp_to()  { "${SCP_CMD[@]}" "$1" "${SSH_USER}@${SERVER}:$2"; }

cleanup() { rm -f "$TARBALL"; }
trap cleanup EXIT

# ── 1. build ────────────────────────────────────
echo "▶ Build apps/docs（production）"
pnpm -C apps/docs build

# ── 2. strip sourcemap ─────────────────────────
echo "▶ Strip sourcemaps"
find "$LOCAL_DIST" -name '*.map' -delete

DIST_SIZE=$(du -sh "$LOCAL_DIST" | cut -f1)
echo "  dist 大小：$DIST_SIZE"

# ── 3. tar（macOS-safe）─────────────────────────
echo "▶ Tar（不帶 macOS xattr）"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$TARBALL" -C "$LOCAL_DIST" .
TAR_SIZE=$(du -sh "$TARBALL" | cut -f1)
echo "  tarball：$TAR_SIZE"

# ── 4. upload + extract ────────────────────────
REMOTE_TAR="/tmp/$(basename "$TARBALL")"
echo "▶ scp → ${SERVER}:${REMOTE_TAR}"
scp_to "$TARBALL" "$REMOTE_TAR"

echo "▶ Extract on server → ${HOST_DIST_DIR}"
ssh_run "
  set -e
  rm -rf ${HOST_DIST_DIR}.new
  mkdir -p ${HOST_DIST_DIR}.new
  tar xzf ${REMOTE_TAR} -C ${HOST_DIST_DIR}.new
  # 原子替換：若舊 dir 存在先 mv 成 .old，再把 .new 換上來
  if [[ -d ${HOST_DIST_DIR} ]]; then
    rm -rf ${HOST_DIST_DIR}.old
    mv ${HOST_DIST_DIR} ${HOST_DIST_DIR}.old
  fi
  mv ${HOST_DIST_DIR}.new ${HOST_DIST_DIR}
  rm -rf ${HOST_DIST_DIR}.old ${REMOTE_TAR}
"

# ── 5. rollout restart ─────────────────────────
echo "▶ Rollout restart deploy/${DEPLOY_NAME}"
ssh_run "kubectl rollout restart deploy/${DEPLOY_NAME} -n ${NAMESPACE} && \
         kubectl rollout status deploy/${DEPLOY_NAME} -n ${NAMESPACE} --timeout=60s"

# ── 6. verify ──────────────────────────────────
echo "▶ Verify https://${DOMAIN}/"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}/" || echo "000")
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "⚠ HTTPS 回應 $HTTP_CODE（不是 200）。請檢查 ingress / cert / DNS。"
  exit 1
fi
echo "✓ ${DOMAIN} → HTTP 200"
echo "✓ 部署完成"
