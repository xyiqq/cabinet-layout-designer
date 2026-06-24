# 部署说明

本文档说明如何在本地、Docker、Docker Hub 和 Linux 服务器上部署 Cabinet Layout Designer。

语言：中文 / [English](DEPLOYMENT.en.md)

## 1. 环境要求

项目默认不需要数据库，也不需要 `.env` 文件。

推荐环境：

- Node.js 20 LTS 或更新版本
- npm 10 或更新版本
- Docker 24+ 和 Docker Compose v2
- 开发环境可使用 Linux、macOS 或 Windows；生产环境推荐 Linux

## 2. 本地开发

```bash
git clone https://github.com/xyiqq/cabinet-layout-designer.git
cd cabinet-layout-designer
npm ci
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

常用检查：

```bash
npm run typecheck
npm run lint
npm run build
npm run test:network-layout
```

## 3. 本地生产模式

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

验证：

```bash
curl -fsSI http://127.0.0.1:3000/
```

## 4. Docker Hub 镜像部署

推荐容器部署方式是直接拉取已发布镜像：

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

映射到其他宿主机端口，例如 `3188`：

```bash
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
```

验证：

```bash
docker ps --filter name=cabinet-layout-designer
curl -fsSI http://127.0.0.1:3188/
docker inspect --format '{{.State.Health.Status}}' cabinet-layout-designer
```

`latest` 是多架构镜像，当前包含：

- `linux/amd64`
- `linux/arm64`

在 ARM 服务器或 Apple Silicon 上，Docker 会自动拉取 `arm64` 镜像。

## 5. Docker Compose 部署

仓库内的 `docker-compose.yml` 默认使用 Docker Hub 镜像，不需要在服务器上从源码构建：

```bash
APP_PORT=3188 docker compose up -d
```

验证：

```bash
docker compose ps
curl -fsSI http://127.0.0.1:3188/
```

查看日志：

```bash
docker compose logs -f cabinet-layout-designer
```

停止：

```bash
docker compose down
```

## 6. 本地源码构建镜像

开发者修改源码后，如需本地构建镜像：

```bash
docker compose -f docker-compose.build.yml up -d --build
```

或手工构建：

```bash
docker build -t xyiqq/cabinet-layout-designer:local .
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:local
```

## 7. Linux 服务器部署

示例目录：

```bash
sudo mkdir -p /opt/cabinet-layout-designer
sudo chown "$USER":"$USER" /opt/cabinet-layout-designer
cd /opt/cabinet-layout-designer
git clone https://github.com/xyiqq/cabinet-layout-designer.git .
```

使用 Docker Compose：

```bash
APP_PORT=3188 docker compose up -d
```

或使用 Node.js 生产模式：

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 3188
```

生产环境推荐 Docker Compose 或 systemd 托管进程。

## 8. systemd 示例

如果不使用 Docker，可用 systemd 管理 Next.js 进程。以下示例假设项目位于 `/opt/cabinet-layout-designer`，监听端口为 `3188`。

创建 `/etc/systemd/system/cabinet-layout-designer.service`：

```ini
[Unit]
Description=Cabinet Layout Designer
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/cabinet-layout-designer
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
ExecStart=/usr/bin/npm run start -- --hostname 0.0.0.0 --port 3188
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cabinet-layout-designer
sudo systemctl status cabinet-layout-designer
```

查看日志：

```bash
journalctl -u cabinet-layout-designer -f
```

## 9. 反向代理示例

如果希望通过域名访问，可以在 Nginx 中把请求转发到本地端口：

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://127.0.0.1:3188;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

公开部署时建议加入 HTTPS、访问控制、基础认证或内网限制。

## 10. 更新部署

Docker Hub / Docker Compose：

```bash
cd /opt/cabinet-layout-designer
git pull
docker pull xyiqq/cabinet-layout-designer:latest
APP_PORT=3188 docker compose up -d
docker compose ps
curl -fsSI http://127.0.0.1:3188/
```

Node.js：

```bash
cd /opt/cabinet-layout-designer
git pull
npm ci
npm run build
sudo systemctl restart cabinet-layout-designer
sudo systemctl status cabinet-layout-designer
```

## 11. 回滚

使用 Git 时，可回到早期提交：

```bash
git log --oneline -n 5
git checkout <commit>
```

使用 Docker 时，升级前建议保留旧镜像 tag：

```bash
docker tag xyiqq/cabinet-layout-designer:latest xyiqq/cabinet-layout-designer:before-upgrade
```

回滚：

```bash
docker rm -f cabinet-layout-designer
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:before-upgrade
```

## 12. Docker Hub 自动发布

仓库包含 `.github/workflows/dockerhub.yml`。推送到 `main`、推送 `v*` tag 或手动运行 workflow 时，会发布 Docker Hub 镜像。

当前仓库使用的 GitHub Actions secret：

- `DOCKERHUB_XYIQQ`: `xyiqq` 账号的 Docker Hub access token

也支持标准双 secret：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

发布 tag：

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- `xyiqq/cabinet-layout-designer:<tag>`，仅 tag 触发时生成
- 架构辅助 tag：`-amd64` 和 `-arm64`

公开镜像 tag 会合成为多架构 manifest。

## 13. 数据与持久化

当前没有后端数据库。

- 内置产品库位于 `data/设备库.json` 和 `data/网络设备库.json`。
- 网络机柜规格位于 `data/网络机柜规格库.ts`。
- 浏览器新增的自定义产品保存在当前浏览器的 `localStorage`。
- 清除浏览器数据或更换电脑后，自定义产品不会自动同步。

如需团队共享产品库，后续应增加后端 API 或导入/导出流程。

## 14. 常见问题

### `npm ci` 失败

确认 Node.js 和 npm 版本：

```bash
node --version
npm --version
```

建议使用 Node.js 20 LTS 或更新版本。

### Docker 容器启动后打不开

检查端口映射和容器日志：

```bash
docker compose ps
docker compose logs -f cabinet-layout-designer
```

确认防火墙或云服务器安全组允许访问映射的宿主机端口。

### 画布空白或交互异常

先运行标准检查：

```bash
npm run typecheck
npm run lint
npm run build
```

如仍有问题，请在 issue 中提供浏览器版本、复现步骤和控制台错误。

### 自定义产品没有同步

这是当前 MVP 限制。自定义产品只保存在浏览器本地。

## 15. 发布安全建议

- 不要提交 `.env`、服务器地址、SSH 用户、私钥、token 或内部部署记录。
- 公开部署时建议使用 HTTPS。
- 如果用于内部项目报价或客户资料，请放在内网或访问控制之后。
- 当前项目没有登录系统，不应直接作为带权限控制的业务系统暴露给所有人。
