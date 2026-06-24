# Docker Hub 镜像发布说明

这个仓库发布到：

```text
xyiqq/cabinet-layout-designer
```

语言：中文 / [English](DOCKERHUB.en.md)

## 直接下载运行

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

浏览器打开：

```text
http://localhost:3000
```

映射到其他端口，例如 `3188`：

```bash
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
```

## 使用 Compose 下载运行

```bash
APP_PORT=3188 docker compose up -d
```

`docker-compose.yml` 默认使用：

```text
xyiqq/cabinet-layout-designer:latest
```

## 本地源码构建

开发者如需从当前源码构建镜像：

```bash
docker compose -f docker-compose.build.yml up -d --build
```

或手工构建：

```bash
docker build -t xyiqq/cabinet-layout-designer:local .
```

## 自动发布到 Docker Hub

仓库包含 `.github/workflows/dockerhub.yml`。推送到 `main`、推送 `v*` tag 或手动运行 workflow 时，会发布 Docker Hub 镜像。

发布 tag：

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- `xyiqq/cabinet-layout-designer:<tag>`，仅 tag 触发时生成
- 带 `-amd64` 和 `-arm64` 后缀的架构辅助 tag

公开 tag 会合成为多架构 manifest，当前支持：

- `linux/amd64`
- `linux/arm64`

## GitHub Actions Secrets

当前仓库使用：

- `DOCKERHUB_XYIQQ`: `xyiqq` 账号的 Docker Hub access token

也支持标准双 secret：

- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub access token

请使用 Docker Hub access token，不要使用登录密码。

## 发布后验证

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker rm -f cabinet-layout-designer 2>/dev/null || true
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
curl -fsSI http://127.0.0.1:3188/
docker inspect --format '{{.State.Health.Status}}' cabinet-layout-designer
```

如需验证架构，可通过 registry API 确认 `latest` 同时包含 `linux/amd64` 和 `linux/arm64`。

## 安全注意

- 不要把真实 `dckr_pat_...` token 放进 GitHub secret 名称、README、截图、issue 或 commit。
- 如果 token 曾经出现在可见字段或截图中，应在 Docker Hub 里 revoke，并重新生成 token。
- Docker Hub 凭据只应保存在 GitHub Actions repository secrets 里。
