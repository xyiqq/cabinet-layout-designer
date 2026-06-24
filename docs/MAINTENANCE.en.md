# Maintenance Notes

This document gives future maintainers a compact map of the project state, code entry points, release workflow, and safety rules.

Language: [中文](MAINTENANCE.zh-CN.md) / English

## Current Status

- Public repository: `https://github.com/xyiqq/cabinet-layout-designer`
- Default branch: `main`
- Docker Hub image: `xyiqq/cabinet-layout-designer:latest`
- Image architectures: `linux/amd64` and `linux/arm64`
- License: MIT
- Framework: Next.js 16.2.9 + React 19.2.0 + TypeScript
- Canvas: Konva / React Konva
- Styling: Tailwind CSS
- Persistence: built-in data files plus browser `localStorage`
- Backend database: none
- Authentication: none

## Public Release Hygiene

The public repository should stay clean. Do not commit:

- `.codex/`, `.agents/`, local agent state, or local instructions not intended for public use
- `node_modules/`, `.next/`, `.tmp-test/`, `.npm-cache/`
- screenshots, generated output, local logs, or browser test artifacts
- internal handoff summaries, real server addresses, backup paths, or rollback logs
- `.env`, tokens, SSH keys, passwords, Docker Hub tokens, or customer data

If a secret appears in a screenshot or visible GitHub field name, revoke it at the provider and replace it.

## Key Directories

```text
app/                    Next.js app entry
components/             UI and Konva canvas components
data/                   Built-in product and rack data
lib/                    Sizing, layout, and U-position algorithms
scripts/                Small regression scripts
types/                  Shared TypeScript types
utils/                  JSON, CSV, and PNG export helpers
docs/                   Deployment and maintenance documentation
```

## Important Code Entry Points

- `components/DesignerShell.tsx`: top-level state, mode switching, localStorage custom products, export actions, add/delete/select flows.
- `components/CabinetCanvas.tsx`: cabinet/control-panel canvas, drag, snap, selection, rows/columns, skeuomorphic drawing.
- `components/NetworkRackCanvas.tsx`: rack U-position canvas, drag, selection, inner DIN component display, PNG export.
- `components/DeviceLibrary.tsx`: normal cabinet product library and custom product UI.
- `components/NetworkDeviceLibrary.tsx`: network rack product library and rack electrical-box components.
- `lib/柜体计算.ts`: cabinet sizing, DIN rail planning, layout, capacity checks, materials.
- `lib/网络机柜计算.ts`: rack sizing, U occupation, materials.
- `lib/网络机柜布局.ts`: rack insertion, U-slot movement, electrical-box capacity and ordering.
- `data/设备库.json`: cabinet/control-panel product library.
- `data/网络设备库.json`: network rack product library.
- `data/网络机柜规格库.ts`: rack presets.

## Verification Commands

```bash
npm ci
npm run typecheck
npm run lint
npm run test:network-layout
npm run build
npm audit --audit-level=moderate
```

For Docker Hub verification:

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d --name cabinet-layout-designer --restart unless-stopped -p 3188:3000 xyiqq/cabinet-layout-designer:latest
curl -fsSI http://127.0.0.1:3188/
```

## Docker Publishing

The workflow is `.github/workflows/dockerhub.yml`.

It publishes:

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- architecture helper tags: `-amd64` and `-arm64`

Current secret:

- `DOCKERHUB_XYIQQ`

The workflow builds amd64 and arm64 on native GitHub runners, then assembles the public multi-architecture manifest.

## Documentation Rule

Public instructions should remain bilingual:

- Use `README.md` for a mixed Chinese/English overview.
- Keep long guides as paired files such as `DEPLOYMENT.zh-CN.md` and `DEPLOYMENT.en.md`.
- Preserve technical identifiers exactly in both languages.
- Update Chinese and English docs in the same change when Docker, GitHub Actions, security, or deployment behavior changes.

## Known Limitations

- Custom products are stored only in browser `localStorage`.
- No backend project storage yet.
- No user accounts, permissions, or collaboration.
- Product library dimensions still need manual curation.
- Canvas interaction tests are limited.
- PDF and quotation exports are not first-class features yet.
- Mobile usability is limited; the product is desktop-oriented.

## Maintenance Priorities

1. Product library import/export.
2. Backend persistence for projects and custom products.
3. More browser interaction tests.
4. PDF report and quotation export.
5. Better reuse between cabinet and rack data models.
6. Source, confidence, and maintenance-date fields for product data.
7. More deployment examples for Vercel, NAS, and registries.
