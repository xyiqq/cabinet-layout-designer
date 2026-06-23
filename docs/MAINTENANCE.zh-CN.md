# 维护总结

这份文档给后续维护者快速了解项目现状、代码入口、发布流程和注意事项。项目是早期 MVP，已经能用，但仍有不少可以继续完善的地方。

## 当前状态

- 公开仓库：`https://github.com/xyiqq/cabinet-layout-designer`
- 默认分支：`main`
- 当前定位：配电箱 / 控制柜 / 网络机柜布局设计 MVP
- 许可证：MIT
- 前端框架：Next.js 16.2.9 + React 18.3.1 + TypeScript
- 画布：Konva / React Konva
- 样式：Tailwind CSS
- 数据存储：内置产品库文件 + 浏览器 `localStorage`
- 后端数据库：暂无
- 用户登录 / 权限：暂无

## 公开发布时做过的清理

公开仓库是从干净目录重新初始化的 Git 历史，不是直接把原工作目录推上去。

已排除内容：

- 本地 `.codex/`、`.agents/` 配置
- `node_modules/`、`.next/`、`.tmp-test/`、`.npm-cache/`
- Playwright 截图、输出图片和临时测试产物
- 内部交接总结、服务器部署记录、备份路径和真实服务器信息
- 任何 `.env`、token、SSH 私钥、服务器账号信息

后续维护时也不要把这些内容提交到公开仓库。

## 关键目录

```text
app/                    Next.js 页面入口
components/             主要 UI 与 Konva 画布
data/                   内置产品库和规格数据
lib/                    尺寸计算、自动排布、U 位逻辑
scripts/                小型回归测试脚本
types/                  中文字段 TypeScript 类型
utils/                  JSON / CSV / PNG 导出辅助逻辑
docs/                   部署和维护文档
```

## 主要文件入口

- `components/DesignerShell.tsx`
  - 主状态容器。
  - 管理普通柜体和网络机柜两种模式。
  - 负责添加、删除、选择、导出、自定义产品 localStorage。
  - `Delete` 键删除选中设备的逻辑也在这里。

- `components/CabinetCanvas.tsx`
  - 配电箱 / 控制柜模式的 2D 画布。
  - 负责拖拽、吸附、选中、行列编辑、设备拟物绘制。

- `components/NetworkRackCanvas.tsx`
  - 网络机柜 U 位图画布。
  - 负责 U 位设备拖动、选中、配电箱内部 DIN 组件显示。

- `components/DeviceLibrary.tsx`
  - 普通模式设备库。
  - 支持自定义产品和可滑动数量选择。

- `components/NetworkDeviceLibrary.tsx`
  - 网络机柜模式设备库。
  - 支持网络设备和箱内 DIN 组件。

- `lib/柜体计算.ts`
  - 普通柜体尺寸推荐、导轨规划、自动布局、空位搜索、材料清单。
  - 自定义尺寸满柜后不能继续添加的核心判断在这里和 `DesignerShell.tsx` 配合完成。

- `lib/网络机柜计算.ts`
  - 网络机柜推荐 U 数、U 位占用表、材料清单。

- `lib/网络机柜布局.ts`
  - 网络设备插入、U 位移动、配电箱 DIN 组件容量和顺序调整。

- `data/设备库.json`
  - 普通配电箱 / 控制柜设备库。

- `data/网络设备库.json`
  - 网络机柜设备库。

- `data/网络机柜规格库.ts`
  - 网络机柜规格预设。

## 当前已实现的核心功能

- 普通配电箱 / 控制柜模式
  - 自动推荐箱体尺寸。
  - 自定义箱体宽、高、深和线槽参数。
  - 拖拽设备到画布。
  - 点击设备库加入设备。
  - DIN 导轨吸附。
  - 设备避免重叠。
  - 自定义尺寸空间不足时阻止继续添加并提示错误。
  - 双击可调数量设备，编辑行数和列数。
  - 选中设备后按 `Delete` 删除。

- 网络机柜模式
  - U 位规划和推荐机柜规格。
  - 网络设备加入后尽量保留已有手动布局。
  - 设备可按 U 位拖动。
  - 配电箱内 DIN 组件容量控制。
  - 选中设备后按 `Delete` 删除。

- 导出
  - 项目 JSON。
  - 设备清单 CSV。
  - 材料清单 CSV。
  - U 位占用表 CSV。
  - 布局 PNG。

## 开发和验证命令

安装依赖：

```bash
npm ci
```

本地开发：

```bash
npm run dev
```

标准验证：

```bash
npm run typecheck
npm run lint
npm run test:network-layout
npm run build
```

生产启动验证：

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3012
```

然后访问：

```text
http://127.0.0.1:3012
```

安全检查：

```bash
npm audit
```

公开发布时已验证 `npm audit` 为 `0 vulnerabilities`。

## Docker

仓库内已经包含：

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

默认运行：

```bash
docker compose up -d --build
```

指定宿主机端口：

```bash
APP_PORT=8080 docker compose up -d --build
```

后续改 Dockerfile 后，建议至少验证：

```bash
docker build -t cabinet-layout-designer:local .
docker run --rm -p 3000:3000 cabinet-layout-designer:local
```

## GitHub 发布流程

公开仓库来自干净发布目录：

```text
C:\Users\dazhazhang\uoloproject\cabinet-layout-designer-open-source
```

原始工作目录：

```text
C:\Users\dazhazhang\uoloproject\cabinet-design
```

如果之后继续在原始工作目录开发，发布前建议同步到开源目录，并确认只包含白名单文件：

```text
app/
components/
data/
docs/
lib/
public/
scripts/
types/
utils/
.dockerignore
.gitattributes
.gitignore
CONTRIBUTING.md
Dockerfile
LICENSE
README.md
docker-compose.yml
eslint.config.mjs
next-env.d.ts
next.config.mjs
package-lock.json
package.json
postcss.config.mjs
tailwind.config.ts
tsconfig.json
tsconfig.test.json
```

提交前检查：

```bash
git status --short
npm ci
npm audit
npm run typecheck
npm run lint
npm run test:network-layout
npm run build
```

推送：

```bash
git add -A
git commit -m "Your change summary"
git push
```

## 敏感信息规则

不要提交：

- 真实服务器域名、IP、端口、SSH 用户名
- 私钥、密码、token、`.env`
- 内部部署目录、备份目录、服务器回滚记录
- 客户项目 JSON、报价数据、截图
- `.next/`、`node_modules/`、`.tmp-test/`、`output/`、日志文件

提交前可以跑简单扫描：

```bash
rg -n -i "(password|passwd|token|secret|apikey|api_key|private key|ssh |root@|\\.env|C:\\\\Users)" .
```

命中文档里的安全提醒是正常的；真实凭据、真实服务器信息不应出现。

## 已知限制

- 自定义产品只存在浏览器 `localStorage`，不能跨设备同步。
- 暂无后端保存项目。
- 暂无登录、权限、多人协作。
- 产品库尺寸仍需要人工校准。
- 画布交互自动化测试较少。
- PDF / 报价单导出还不是一等功能。
- 移动端可用性有限，主要按桌面端设计。

## 后续优先级建议

1. 增加产品库导入 / 导出功能。
2. 增加后端持久化，保存自定义产品和项目。
3. 补更多浏览器端交互测试。
4. 增加 PDF 报告和报价单导出。
5. 优化网络机柜和配电箱之间的数据复用。
6. 给产品库增加来源字段、尺寸可信度字段和维护日期。
7. 增加部署到 Vercel、Docker Registry、NAS 的示例。

## 维护心法

- 优先保持工具可运行，不要为了重构破坏现有画布流程。
- 改产品库时尽量保留备注，说明尺寸来源或估算规则。
- 改布局算法时至少跑 `test:network-layout`，最好再手工打开页面试一次普通柜体和网络机柜。
- 新增公共文档时不要引用内部服务器或个人本地路径。
- 发布前以干净目录为准，不要直接发布原工作目录。
