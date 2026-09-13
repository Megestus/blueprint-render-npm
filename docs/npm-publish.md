# npm 发布说明

`blueprint-render` 已按 npm 包规范准备好（`package.json` exports/files/scripts），
发布与否**可选**。三种消费方式从轻到重：

## 方式 A：本地目录直接引用（零发布）

blogmain 与 blueprint-render 同机时：

```bash
# blogmain 里
pnpm add file:../blueprint-render
```

改动 core 后需在 blueprint-render 里 `npm run build` 再重建 blogmain。

## 方式 B：Gitea 仓库直装（推荐，无 npm 账号）

把仓库推到 Gitea 后：

```bash
# 任意机器 / 任意项目
npm install git+http://192.168.31.76:3000/Megestus/blueprint-render.git
```

不需要 npm 账号，版本随仓库走，自托管环境里最快。

## 方式 C：发布到 npm 官方源（公开分发）

适合要给别人用、或者换机器不想拉 Gitea 的场景：

```bash
npm login            # 需要 npm 账号（https://www.npmjs.com/signup）
npm run build        # prepublishOnly 也会自动执行
npm publish
```

要点：

- **包名**：`blueprint-render` 在 npm 官方源当前**可用**（已核实，2026-09）。
  若未来被占用，改 scoped 名 `@<你的用户名>/blueprint-render`。
- **版本号**：语义化版本（semver）。改坏兼容性 → `npm version major`；
  加功能 → `minor`；修 bug → `patch`。发布后版本号不可覆盖（npm 不可变）。
- **发布内容**：`files` 字段只发 `dist/ src/ docs/ README.md LICENSE`，约 330KB。
- **更新**：`npm version patch && npm publish`。
- **撤回**：`npm unpublish` 仅 72 小时内可用，之后只能发新版本；慎用。

## 发布前自查清单

- [ ] `npm run build` 通过，`dist/blueprint-viewer.js` 存在且语法正确
- [ ] `npm pack --dry-run` 确认发布内容（无 node_modules、无临时文件）
- [ ] LICENSE / LICENSE.blueprintUE 都在（含 BlueprintUE 版权声明）
- [ ] `README.md` 首屏可用示例正确
