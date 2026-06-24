# 维护说明

这份文档给后续维护者快速了解项目现状、代码入口、发布流程和安全注意事项。

语言：中文 / [English](MAINTENANCE.en.md)

## 当前状态

- 公开仓库：`https://github.com/xyiqq/cabinet-layout-designer`
- 默认分支：`main`
- Docker Hub 镜像：`xyiqq/cabinet-layout-designer:latest`
- 镜像架构：`linux/amd64` 和 `linux/arm64`
- 许可证：MIT
- 前端框架：Next.js 16.2.9 + React 18.3.1 + TypeScript
- 画布：Konva / React Konva
- 样式：Tailwind CSS
- 数据存储：内置数据文件 + 浏览器 `localStorage`
- 后端数据库：暂无
- 用户登录 / 权限：暂无

## 公开发布清理规则

公开仓库应保持干净。不要提交：

- `.codex/`、`.agents/`、本地 agent 状态或不适合公开的本地说明
- `node_modules/`、`.next/`、`.tmp-test/`、`.npm-cache/`
- 截图、生成输出、本地日志、浏览器测试产物
- 内部交接总结、真实服务器地址、备份路径、回滚记录
- `.env`、token、SSH 私钥、密码、Docker Hub token、客户资料

如果 secret 出现在截图或可见的 GitHub 字段名中，应在对应平台 revoke 并重新生成。

## 关键目录

```text
app/                    Next.js 页面入口
components/             UI 和 Konva 画布组件
data/                   内置产品和机柜数据
lib/                    尺寸、布局、U 位算法
scripts/                小型回归脚本
types/                  共享 TypeScript 类型
utils/                  JSON、CSV、PNG 导出辅助逻辑
docs/                   部署和维护文档
```

## 主要代码入口

- `components/DesignerShell.tsx`：顶层状态、模式切换、自定义产品 localStorage、导出、添加、删除、选中流程。
- `components/CabinetCanvas.tsx`：配电箱 / 控制柜画布、拖拽、吸附、选中、行列编辑、拟物绘制。
- `components/NetworkRackCanvas.tsx`：网络机柜 U 位画布、拖拽、选中、箱内 DIN 组件显示、PNG 导出。
- `components/DeviceLibrary.tsx`：普通柜体产品库和自定义产品入口。
- `components/NetworkDeviceLibrary.tsx`：网络机柜产品库和机柜配电箱组件。
- `lib/柜体计算.ts`：柜体尺寸、DIN 导轨规划、布局、容量检查、材料。
- `lib/网络机柜计算.ts`：机柜尺寸、U 位占用、材料。
- `lib/网络机柜布局.ts`：机柜插入、U 位移动、配电箱容量和顺序。
- `data/设备库.json`：配电箱 / 控制柜产品库。
- `data/网络设备库.json`：网络机柜产品库。
- `data/网络机柜规格库.ts`：机柜规格预设。

## 验证命令

```bash
npm ci
npm run typecheck
npm run lint
npm run test:network-layout
npm run build
npm audit --audit-level=moderate
```

Docker Hub 验证：

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d --name cabinet-layout-designer --restart unless-stopped -p 3188:3000 xyiqq/cabinet-layout-designer:latest
curl -fsSI http://127.0.0.1:3188/
```

## Docker 发布

发布 workflow 是 `.github/workflows/dockerhub.yml`。

它会发布：

- `xyiqq/cabinet-layout-designer:latest`
- `xyiqq/cabinet-layout-designer:sha-<commit>`
- 架构辅助 tag：`-amd64` 和 `-arm64`

当前 secret：

- `DOCKERHUB_XYIQQ`

workflow 使用 GitHub 原生 amd64 和 arm64 runner 分别构建，再合成公开多架构 manifest。

## 文档规则

公开说明应保持双语：

- `README.md` 使用中英混排概要。
- 长文档使用成对文件，例如 `DEPLOYMENT.zh-CN.md` 和 `DEPLOYMENT.en.md`。
- 两种语言都必须保留技术标识符原文。
- Docker、GitHub Actions、安全或部署行为变化时，中英文文档要在同一个变更里同步更新。

## 已知限制

- 自定义产品只保存在浏览器 `localStorage`。
- 暂无后端项目保存。
- 暂无用户账号、权限和协作。
- 产品库尺寸仍需人工校准。
- 画布交互自动化测试较少。
- PDF 和报价单导出还不是一等功能。
- 移动端可用性有限，主要面向桌面端。

## 后续优先级建议

1. 增加产品库导入 / 导出。
2. 增加项目和自定义产品的后端持久化。
3. 增加更多浏览器交互测试。
4. 增加 PDF 报告和报价单导出。
5. 优化配电箱和网络机柜之间的数据复用。
6. 给产品库增加来源、可信度和维护日期字段。
7. 增加 Vercel、NAS、更多 registry 的部署示例。
