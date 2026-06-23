# 部署说明

本文档说明如何在本地、Docker 和普通服务器上部署 Cabinet Layout Designer。

## 1. 环境要求

本项目不依赖数据库，默认不需要 `.env` 文件。

推荐环境：

- Node.js 20 LTS 或更新版本
- npm 10 或更新版本
- Docker 24+ 和 Docker Compose v2（使用 Docker 部署时）
- Linux、macOS 或 Windows 均可开发；生产环境推荐 Linux

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

常用检查命令：

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

如果要改端口，把 `3000` 替换成你自己的端口。

## 4. Docker Compose 部署

默认端口为宿主机 `3000`：

```bash
docker compose up -d --build
```

验证：

```bash
docker compose ps
curl -fsSI http://127.0.0.1:3000/
```

使用其他宿主机端口，例如 `8080`：

```bash
APP_PORT=8080 docker compose up -d --build
curl -fsSI http://127.0.0.1:8080/
```

查看日志：

```bash
docker compose logs -f cabinet-layout-designer
```

停止服务：

```bash
docker compose down
```

## 5. 手工 Docker 部署

```bash
docker build -t cabinet-layout-designer:latest .
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  cabinet-layout-designer:latest
```

验证：

```bash
docker ps --filter name=cabinet-layout-designer
curl -fsSI http://127.0.0.1:3000/
```

停止并删除容器：

```bash
docker rm -f cabinet-layout-designer
```

## 6. Linux 服务器部署

示例目录：

```bash
sudo mkdir -p /opt/cabinet-layout-designer
sudo chown "$USER":"$USER" /opt/cabinet-layout-designer
cd /opt/cabinet-layout-designer
git clone https://github.com/xyiqq/cabinet-layout-designer.git .
```

然后选择 Docker Compose：

```bash
APP_PORT=8080 docker compose up -d --build
```

或选择 Node.js 生产模式：

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 8080
```

建议生产环境使用 Docker Compose 或 systemd 托管进程。

## 7. systemd 示例

如果不用 Docker，可以用 systemd 管理 Next.js 进程。下面示例假设项目在 `/opt/cabinet-layout-designer`，端口为 `8080`。

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
ExecStart=/usr/bin/npm run start -- --hostname 0.0.0.0 --port 8080
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

## 8. 反向代理示例

如果你希望通过域名访问，可以在 Nginx 中把请求转发到本地端口。下面仅为模板，请替换域名和端口。

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

如果公开部署，请根据需要加入 HTTPS、访问控制、基础认证或内网限制。

## 9. 更新部署

Docker Compose：

```bash
cd /opt/cabinet-layout-designer
git pull
APP_PORT=8080 docker compose up -d --build
docker compose ps
curl -fsSI http://127.0.0.1:8080/
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

## 10. 回滚

如果使用 Git，可以回到上一个提交：

```bash
git log --oneline -n 5
git checkout <commit>
```

然后重新执行对应部署命令。

如果使用 Docker，建议在升级前打镜像标签：

```bash
docker tag cabinet-layout-designer:latest cabinet-layout-designer:before-upgrade
```

回滚时用旧标签启动：

```bash
docker rm -f cabinet-layout-designer
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 8080:3000 \
  cabinet-layout-designer:before-upgrade
```

## 11. 数据与持久化

当前没有后端数据库。

- 内置产品库在 `data/设备库.json`、`data/网络设备库.json`。
- 网络机柜规格在 `data/网络机柜规格库.ts`。
- 浏览器新增的自定义产品保存在当前浏览器的 `localStorage`。
- 清除浏览器数据或换电脑后，自定义产品不会自动同步。

如果需要团队共享产品库，建议后续增加后端接口或把产品库改成可导入/导出的文件。

## 12. 常见问题

### `npm ci` 失败

确认 Node.js 和 npm 版本：

```bash
node --version
npm --version
```

建议使用 Node.js 20 LTS。

### Docker 容器启动后打不开

检查端口映射和容器日志：

```bash
docker compose ps
docker compose logs -f cabinet-layout-designer
```

确认防火墙或云服务器安全组允许访问你映射的宿主机端口。

### 画布空白或交互异常

先跑构建检查：

```bash
npm run typecheck
npm run lint
npm run build
```

如果仍有问题，请在 issue 中提供浏览器版本、操作步骤和控制台错误。

### 自定义产品没有同步

这是当前 MVP 的已知限制。自定义产品只保存在浏览器本地。

## 13. 发布安全建议

- 不要提交 `.env`、服务器地址、SSH 用户、私钥、token 或内部部署记录。
- 公开部署时建议使用 HTTPS。
- 如果用于内部项目报价或客户资料，请把服务放在内网或访问控制之后。
- 当前项目没有登录系统，不适合作为带权限控制的业务系统直接裸露给所有人。
