# Deploy

部署 `apps/docs` 到 k3s server，提供 https://play-kit-doc.bwinify.com/。

## 架構

- **Server**: k3s on <your-k3s-server>（單節點）
- **Namespace**: `play-kit-doc`（獨立、不影響其他 service）
- **Container**: `nginx:1.27-alpine` 透過 hostPath mount 服務 `/srv/play-kit-doc/dist`
- **Ingress**: `ingress-nginx`，TLS 由 cert-manager + Let's Encrypt（HTTP-01）

## 首次部署

```bash
# 1. apply ClusterIssuer（若尚未建立）
kubectl apply -f deploy/k8s/letsencrypt-http01-issuer.yaml

# 2. apply 主 manifest
kubectl apply -f deploy/k8s/play-kit-doc.yaml

# 3. 第一次推 dist 上去
K3S_SSH_PASS='xxx' ./scripts/deploy-docs.sh
```

## 後續更新（每次改完 docs 跑這個）

```bash
K3S_SSH_PASS='xxx' ./scripts/deploy-docs.sh
```

或預設好密碼後直接：

```bash
./scripts/deploy-docs.sh
```

腳本流程：
1. `pnpm -C apps/docs build`
2. 移除 sourcemap（公開站點不暴露原始碼）
3. macOS-safe tar（不帶 xattr / `._*` resource fork）
4. scp → 原子替換 `/srv/play-kit-doc/dist`
5. `kubectl rollout restart` 確保 nginx 重新載入
6. curl https://play-kit-doc.bwinify.com/ 驗證 HTTP 200

## 環境變數

| 變數 | 預設 | 說明 |
|---|---|---|
| `K3S_SSH_KEY` | — | SSH private key 路徑（推薦，比 password 安全） |
| `K3S_SSH_PASS` | — | SSH 密碼（fallback；需 `brew install sshpass`） |
| `K3S_SERVER` | `<your-k3s-server>` | server IP |
| `K3S_SSH_USER` | `root` | SSH user |
| `K3S_NAMESPACE` | `play-kit-doc` | k8s namespace |
| `K3S_DEPLOY` | `play-kit-doc` | deployment 名稱 |
| `K3S_HOST_DIST` | `/srv/play-kit-doc/dist` | server 上的 dist 目錄 |
| `K3S_DOMAIN` | `play-kit-doc.bwinify.com` | 驗證網址 |

## 推薦：改用 SSH key（一次性設定）

```bash
# 在本機產 key（若尚未有）
ssh-keygen -t ed25519 -C "play-kit-doc-deploy"

# 推上 server
ssh-copy-id root@<your-k3s-server>

# 之後 deploy 不再需要密碼
K3S_SSH_KEY=~/.ssh/id_ed25519 ./scripts/deploy-docs.sh
```

## Rollback

```bash
ssh root@<your-k3s-server> 'kubectl rollout undo deploy/play-kit-doc -n play-kit-doc'
```

## 觀察

```bash
# pod 狀態
ssh root@<your-k3s-server> 'kubectl get all -n play-kit-doc'

# nginx access log
ssh root@<your-k3s-server> 'kubectl logs -n play-kit-doc deploy/play-kit-doc -f'

# 證書狀態 / 到期日
ssh root@<your-k3s-server> 'kubectl get cert -n play-kit-doc'
echo | openssl s_client -servername play-kit-doc.bwinify.com \
  -connect play-kit-doc.bwinify.com:443 2>/dev/null \
  | openssl x509 -noout -dates
```

## 完全重建（緊急時）

```bash
# 刪整個 namespace（保留 ClusterIssuer / hostPath 資料）
ssh root@<your-k3s-server> 'kubectl delete namespace play-kit-doc'

# 重 apply
kubectl apply -f deploy/k8s/play-kit-doc.yaml

# 重推 dist
./scripts/deploy-docs.sh
```
