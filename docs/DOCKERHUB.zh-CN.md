# Docker Hub 镜像发布说明

这个仓库默认发布到：

```text
xyiqq/cabinet-layout-designer
```

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

如果要映射到其他端口，例如 `3188`：

```bash
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
```

## 使用 compose 下载运行

```bash
APP_PORT=3188 docker compose up -d
```

`docker-compose.yml` 默认会使用 Docker Hub 镜像：

```text
xyiqq/cabinet-layout-designer:latest
```

## 本地源码构建

开发者如果想从当前源码构建镜像，使用单独的构建 compose 文件：

```bash
docker compose -f docker-compose.build.yml up -d --build
```

或手动构建：

```bash
docker build -t xyiqq/cabinet-layout-designer:local .
```

## 自动发布到 Docker Hub

仓库包含 `.github/workflows/dockerhub.yml`。推送到 `main` 或推送 `v*` tag 时，GitHub Actions 会构建并推送 Docker Hub 镜像：

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- `xyiqq/cabinet-layout-designer:<tag>`，仅 tag 触发时生成
- 同时会先生成带 `-amd64` 和 `-arm64` 后缀的架构专用辅助 tag，再合成多架构 manifest。

第一次启用前，需要在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 添加以下任一种配置。

当前仓库使用的是：

- `DOCKERHUB_XYIQQ`: Docker Hub access token

也可以使用标准的双 secret 配置：

- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub access token，不建议使用登录密码

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
