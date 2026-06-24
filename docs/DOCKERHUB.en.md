# Docker Hub Publishing Guide

This repository publishes to:

```text
xyiqq/cabinet-layout-designer
```

Language: [中文](DOCKERHUB.zh-CN.md) / English

## Pull And Run

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

Open:

```text
http://localhost:3000
```

Use another host port, for example `3188`:

```bash
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
```

## Pull With Compose

```bash
APP_PORT=3188 docker compose up -d
```

`docker-compose.yml` defaults to:

```text
xyiqq/cabinet-layout-designer:latest
```

## Build From Source

Use this when developing from the current source tree:

```bash
docker compose -f docker-compose.build.yml up -d --build
```

Or build manually:

```bash
docker build -t xyiqq/cabinet-layout-designer:local .
```

## Automatic Docker Hub Publishing

The repository includes `.github/workflows/dockerhub.yml`. Pushes to `main`, `v*` tags, and manual workflow dispatch publish Docker Hub images.

Published tags:

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- `xyiqq/cabinet-layout-designer:<tag>` for release tags
- Architecture helper tags with `-amd64` and `-arm64` suffixes

The public tags are assembled as multi-architecture manifests for:

- `linux/amd64`
- `linux/arm64`

## GitHub Actions Secrets

Current repository setup:

- `DOCKERHUB_XYIQQ`: Docker Hub access token for the `xyiqq` account

Alternative standard setup:

- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

Use an access token, not the Docker Hub login password.

## Verify After Publishing

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

To verify architectures through the registry API, check that `latest` includes both `linux/amd64` and `linux/arm64`.

## Security Notes

- Never put a real `dckr_pat_...` token in a GitHub secret name, README, screenshot, issue, or commit.
- If a token appears in a visible field or screenshot, revoke it in Docker Hub and create a new token.
- Keep Docker Hub credentials only in GitHub Actions repository secrets.
