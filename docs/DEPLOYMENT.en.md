# Deployment Guide

This guide explains how to run Cabinet Layout Designer locally, with Docker, and on a Linux server.

## 1. Requirements

The project does not require a database and does not require an `.env` file by default.

Recommended environment:

- Node.js 20 LTS or newer
- npm 10 or newer
- Docker 24+ and Docker Compose v2 for Docker deployment
- Linux, macOS, or Windows for development; Linux is recommended for production

## 2. Local Development

```bash
git clone https://github.com/xyiqq/cabinet-layout-designer.git
cd cabinet-layout-designer
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:network-layout
```

## 3. Local Production Mode

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

Verify:

```bash
curl -fsSI http://127.0.0.1:3000/
```

Use another port by replacing `3000`.

## 4. Docker Hub Image Deployment

The recommended container path is to pull the published Docker Hub image:

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

Verify:

```bash
docker ps --filter name=cabinet-layout-designer
curl -fsSI http://127.0.0.1:3000/
docker inspect --format '{{.State.Health.Status}}' cabinet-layout-designer
```

Use another host port, for example `8080`:

```bash
docker rm -f cabinet-layout-designer
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 8080:3000 \
  xyiqq/cabinet-layout-designer:latest
```

## 5. Docker Compose Deployment

The included `docker-compose.yml` defaults to Docker Hub image downloads, so a server does not need to build from source.

The default host port is `3000`:

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
curl -fsSI http://127.0.0.1:3000/
```

Use a different host port, for example `8080`:

```bash
APP_PORT=8080 docker compose up -d
curl -fsSI http://127.0.0.1:8080/
```

View logs:

```bash
docker compose logs -f cabinet-layout-designer
```

Stop:

```bash
docker compose down
```

## 6. Local Source Image Build

Use this path when you are changing the source and want to build the image yourself.

```bash
docker compose -f docker-compose.build.yml up -d --build
```

Or build manually:

```bash
docker build -t xyiqq/cabinet-layout-designer:local .
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:local
```

Verify:

```bash
docker ps --filter name=cabinet-layout-designer
curl -fsSI http://127.0.0.1:3000/
```

Stop and remove:

```bash
docker rm -f cabinet-layout-designer
```

## 7. Linux Server Deployment

Example directory:

```bash
sudo mkdir -p /opt/cabinet-layout-designer
sudo chown "$USER":"$USER" /opt/cabinet-layout-designer
cd /opt/cabinet-layout-designer
git clone https://github.com/xyiqq/cabinet-layout-designer.git .
```

Then use Docker Compose:

```bash
APP_PORT=8080 docker compose up -d
```

Or use Node.js production mode:

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 8080
```

For production, Docker Compose or systemd is recommended.

## 8. systemd Example

If you do not use Docker, systemd can manage the Next.js process. The example below assumes the project is located at `/opt/cabinet-layout-designer` and listens on port `8080`.

Create `/etc/systemd/system/cabinet-layout-designer.service`:

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

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cabinet-layout-designer
sudo systemctl status cabinet-layout-designer
```

View logs:

```bash
journalctl -u cabinet-layout-designer -f
```

## 9. Reverse Proxy Example

To serve the app behind a domain, proxy requests to the local app port. Replace the domain and port in this template.

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

For public deployments, add HTTPS, access control, basic authentication, or private network restrictions as needed.

## 10. Updating a Deployment

Docker Hub image or Docker Compose:

```bash
cd /opt/cabinet-layout-designer
git pull
docker pull xyiqq/cabinet-layout-designer:latest
APP_PORT=8080 docker compose up -d
docker compose ps
curl -fsSI http://127.0.0.1:8080/
```

Node.js:

```bash
cd /opt/cabinet-layout-designer
git pull
npm ci
npm run build
sudo systemctl restart cabinet-layout-designer
sudo systemctl status cabinet-layout-designer
```

## 11. Rollback

With Git, check out an earlier commit:

```bash
git log --oneline -n 5
git checkout <commit>
```

Then redeploy with the relevant commands.

With Docker, tag the current image before an upgrade:

```bash
docker tag xyiqq/cabinet-layout-designer:latest xyiqq/cabinet-layout-designer:before-upgrade
```

Rollback by starting the old tag:

```bash
docker rm -f cabinet-layout-designer
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 8080:3000 \
  xyiqq/cabinet-layout-designer:before-upgrade
```

## 12. Data and Persistence

There is no backend database yet.

- Built-in products live in `data/设备库.json` and `data/网络设备库.json`.
- Rack presets live in `data/网络机柜规格库.ts`.
- Browser-created custom products are saved in the current browser's `localStorage`.
- Custom products are not synced across browsers or devices.

For team-shared product libraries, add a backend API or an import/export workflow.

## 13. Docker Hub Publishing

The repository includes `.github/workflows/dockerhub.yml`. It publishes the Docker Hub image on pushes to `main`, on `v*` tags, and on manual workflow dispatch.

Required GitHub Actions secrets:

- `DOCKERHUB_XYIQQ`, containing a Docker Hub access token for the `xyiqq` account.
- Alternatively, use `DOCKERHUB_USERNAME` plus `DOCKERHUB_TOKEN`.

Published tags:

- `xyiqq/cabinet-layout-designer:latest` for `main`
- `xyiqq/cabinet-layout-designer:sha-<commit>` for commit-addressable images
- `xyiqq/cabinet-layout-designer:<tag>` for release tags

See [DOCKERHUB.zh-CN.md](DOCKERHUB.zh-CN.md) for the Chinese publishing checklist.

## 14. Troubleshooting

### `npm ci` fails

Check Node.js and npm:

```bash
node --version
npm --version
```

Node.js 20 LTS is recommended.

### The Docker container starts but the app is unreachable

Check port mapping and logs:

```bash
docker compose ps
docker compose logs -f cabinet-layout-designer
```

Make sure your firewall or cloud security group allows the mapped host port.

### The canvas is blank or interaction fails

Run the standard checks:

```bash
npm run typecheck
npm run lint
npm run build
```

If the issue remains, open an issue with your browser version, reproduction steps, and console errors.

### Custom products do not sync

This is a known MVP limitation. Custom products are browser-local only.

## 15. Security Notes

- Do not commit `.env` files, server addresses, SSH usernames, private keys, tokens, or internal deployment logs.
- Use HTTPS for public deployments.
- If the tool is used for internal quotations or customer projects, place it behind an internal network or access control.
- The project has no login system yet and should not be treated as an access-controlled business application by itself.
