# blueprint-render

框架无关的 **UE 蓝图 / 材质图查看器**：`<blueprint-viewer>` Web Component + BlueprintUE 增强渲染器。
一套核心，适配 VuePress / Astro / 原生 HTML 等任意构建器。

## 这是什么

- **core**：`<blueprint-viewer>` 自定义元素（light DOM），内置蓝图文本加载、渲染、
  「copy code」按钮、自动全图适配（All）、左下角操作提示、右下角水印。
- **渲染器**：基于 [BlueprintUE](https://github.com/blueprintue/blueprintue-self-hosted-edition) 官方
  render.js（MIT）的增强版，改动：左键拖动画布（原右键，避免浏览器手势冲突）、
  All 全图显示按钮、英文操作提示、水印缩小、默认 auto-fit 支持。
- **适配层**：`src/vuepress/BlueprintRender.vue`（VuePress 2）、`src/astro/BlueprintViewer.astro`。

## 快速使用

### 原生 HTML

```html
<script type="module" src="/blueprint-render/blueprint-viewer.js"></script>

<blueprint-viewer src="/blueprints/BP_Texeldensity.txt" height="643"></blueprint-viewer>
```

### VuePress 2

```bash
npm install blueprint-render
# 把 src/vuepress/BlueprintRender.vue 放进 .vuepress/components/ 并在 client.ts 注册
# 文章里继续写 <BlueprintRender src="/blueprints/xxx.txt" />
```

### Astro

```astro
---
import BlueprintViewer from "blueprint-render/astro";
---
<BlueprintViewer src="/blueprints/xxx.txt" />
```

## 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `src` | string | — | 蓝图文本文件 URL（与 `text` 二选一，`src` 优先） |
| `text` | string | — | 直接传入蓝图文本 |
| `height` | number | 643 | 渲染区域高度（px） |
| `show-copy` | boolean | true | 显示「copy code」按钮 |
| `auto-fit` | boolean | true | 渲染完成后自动全图适配 |
| `title` | string | Blueprint | 无障碍 / 提示标题 |

## 开发

```bash
npm install        # 无需任何依赖（构建脚本零依赖）
npm run build      # 生成 dist/blueprint-viewer.js（自包含单文件）
```

核心源码：`src/core/`（`render.js` / `render.css` 为单一事实来源，`blueprint-viewer.js` 为组件）。
构建产物 `dist/blueprint-viewer.js` 为自包含 ESM，可被 Vite / Astro / `<script type="module">` 直接使用。

## 文档

- [VuePress 集成](docs/vuepress.md)
- [Astro 集成](docs/astro.md)
- [npm 发布说明](docs/npm-publish.md)

## 许可

MIT。渲染器版权归 BlueprintUE（见 `LICENSE.blueprintUE`），增强修改见
`src/core/render.js` 文件头声明。
