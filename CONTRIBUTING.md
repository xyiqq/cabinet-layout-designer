# Contributing / 贡献指南

Thanks for helping improve Cabinet Layout Designer.

感谢你参与改进 Cabinet Layout Designer。

## Development Setup / 开发环境

```bash
npm ci
npm run dev
```

Before opening a pull request, run:

提交 PR 前建议运行：

```bash
npm run typecheck
npm run lint
npm run build
npm run test:network-layout
```

## Good First Contributions / 适合优先贡献的方向

- Add or correct product library entries in `data/设备库.json` and `data/网络设备库.json`.
- Improve cabinet and rack sizing algorithms in `lib/柜体计算.ts` and `lib/网络机柜计算.ts`.
- Improve U-position and cabinet layout behavior in `lib/网络机柜布局.ts`.
- Add import/export workflows for custom product libraries.
- Add backend persistence for browser-created custom products.
- Improve canvas interaction tests.
- Improve translations and documentation.

- 在 `data/设备库.json` 和 `data/网络设备库.json` 中增加或修正产品库条目。
- 改进 `lib/柜体计算.ts` 和 `lib/网络机柜计算.ts` 中的尺寸计算算法。
- 改进 `lib/网络机柜布局.ts` 中的 U 位和柜体布局逻辑。
- 增加自定义产品库的导入/导出流程。
- 为浏览器创建的自定义产品增加后端持久化。
- 补充画布交互测试。
- 改进翻译和文档。

## Code Style / 代码风格

- Keep changes focused and small when possible.
- Prefer existing data structures and naming patterns.
- Keep product data factual and include useful notes when dimensions are approximate.
- Avoid committing generated files, screenshots, local logs, or deployment credentials.

- 尽量保持改动聚焦、易审查。
- 优先沿用现有数据结构和命名方式。
- 产品尺寸如果是估算值，请在备注中说明。
- 不要提交生成文件、截图、本地日志或部署凭据。

## Security / 安全

Do not include:

- Real server domains or IPs.
- SSH usernames, private keys, passwords, or tokens.
- Internal deployment paths and backup logs.
- Customer project data.

不要提交：

- 真实服务器域名或 IP。
- SSH 用户名、私钥、密码或 token。
- 内部部署路径和备份日志。
- 客户项目数据。
