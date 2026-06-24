# Cabinet Layout Designer / 柜体布局设计器

An open-source MVP for planning electrical cabinets, control panels, and network racks.

这是一个开源的柜体布局设计 MVP，用于配电箱、控制柜和网络机柜的尺寸估算、设备摆放、清单导出和快速方案沟通。

> Status: early-stage but usable. The current goal is to make the tool easy to run, inspect, and extend.
>
> 状态：半成品但已经可用。当前目标是让大家能快速运行、查看代码并继续扩展功能。

## Features / 功能

- Electrical cabinet / control panel mode with DIN rail layout.
- Network rack mode with U-position planning.
- Built-in product libraries in JSON / TypeScript data files.
- Custom local product entries stored in browser `localStorage`.
- Drag-and-drop placement, snapping, row/column editing, and Delete-key removal.
- CSV export for device lists and material lists.
- JSON export for project data.
- PNG export for cabinet / rack layout images.

- 配电箱 / 控制柜模式，支持 DIN 导轨布局。
- 网络机柜模式，支持 U 位规划。
- 产品库使用 JSON / TypeScript 数据文件维护。
- 浏览器本地自定义产品，存储在 `localStorage`。
- 支持拖拽摆放、吸附、行列编辑、选中后按 Delete 删除。
- 支持导出设备清单和材料清单 CSV。
- 支持导出项目 JSON。
- 支持导出柜体 / 机柜布局 PNG。

## Tech Stack / 技术栈

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Konva / React Konva

## Quick Start / 快速开始

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

打开 `http://localhost:3000`。

## Useful Commands / 常用命令

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run start
npm run test:network-layout
```

## Docker

Pull the published image from Docker Hub:

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

Or use the included compose file, which defaults to the same Docker Hub image:

```bash
docker compose up -d
```

By default the app is exposed on `http://localhost:3000`.

默认访问地址是 `http://localhost:3000`。

To use another host port:

如需使用其他宿主机端口：

```bash
APP_PORT=8080 docker compose up -d
```

To build the image from local source instead of downloading it:

```bash
docker compose -f docker-compose.build.yml up -d --build
```

## Deployment Guides / 部署说明

- Chinese: [docs/DEPLOYMENT.zh-CN.md](docs/DEPLOYMENT.zh-CN.md)
- English: [docs/DEPLOYMENT.en.md](docs/DEPLOYMENT.en.md)
- Docker Hub publishing: [docs/DOCKERHUB.zh-CN.md](docs/DOCKERHUB.zh-CN.md)
- Maintenance notes: [docs/MAINTENANCE.zh-CN.md](docs/MAINTENANCE.zh-CN.md)

## Project Structure / 项目结构

```text
app/                    Next.js app entry
components/             UI and canvas components
data/                   Built-in product and cabinet/rack data
lib/                    Layout and sizing algorithms
scripts/                Small verification scripts
types/                  Shared TypeScript types
utils/                  Export helpers
docs/                   Deployment documentation
```

## Data Notes / 数据说明

Product data is currently file-based:

产品数据当前以文件形式维护：

- `data/设备库.json`: electrical cabinet / control panel product library.
- `data/网络设备库.json`: network rack product library.
- `data/网络机柜规格库.ts`: rack size presets.

Browser-created custom products are local-only and are not uploaded to a server.

浏览器里新增的自定义产品只保存在当前浏览器本地，不会自动上传到服务器。

## Contributing / 参与贡献

Contributions are welcome. Good first tasks include:

欢迎贡献。适合优先改进的方向：

- More product library entries.
- Better collision and capacity checks.
- Import/export improvements.
- Backend persistence for custom products.
- More deployment templates.
- Better tests for canvas interactions.

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Security / 安全说明

This project is a client-side planning tool and currently has no authentication, user system, or server-side database. If you deploy it publicly, place it behind your own access control or reverse proxy policy when needed.

本项目当前是前端规划工具，没有内置认证、用户系统或服务端数据库。如果部署到公网，请根据需要自行放在访问控制或反向代理策略之后。

## License / 许可证

MIT
