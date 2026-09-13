# Astro 集成

## 安装

```bash
npm install blueprint-render
```

## 使用

1. 蓝图 `.txt` 文件放进 Astro 项目的 `public/blueprints/`（构建时自动发布到站点根）。

2. 页面里使用 `BlueprintViewer` 组件：

```astro
---
import BlueprintViewer from "blueprint-render/astro";
---
<BlueprintViewer src="/blueprints/BP_Texeldensity.txt" height="643" />
```

3. 组件内部 `<script>` 已 `import "blueprint-render"`（npm 包自引用，经
   `package.json` 的 `exports` 解析到 `dist/blueprint-viewer.js`），Astro 会自动
   打包并按需加载到客户端。

## 无需框架的用法

蓝图是自定义元素，Astro 原生支持，任何页面都可以直接裸用：

```html
<blueprint-viewer src="/blueprints/xxx.txt" auto-fit="true" show-copy="true"></blueprint-viewer>
```

只要在页面（或 Layout）里把核心脚本带上即可：

```html
<script type="module" src="/blueprint-render/blueprint-viewer.js"></script>
```

（`dist/blueprint-viewer.js` 拷到 `public/blueprint-render/`，或直接用 npm 包里的
`node_modules/blueprint-render/dist/blueprint-viewer.js`。）

## 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `src` | string | — | 蓝图文本文件 URL |
| `text` | string | — | 直接传入蓝图文本 |
| `height` | number | 643 | 渲染区域高度（px） |
| `showCopy` | boolean | true | 显示「copy code」按钮 |
| `autoFit` | boolean | true | 渲染完成后自动全图适配 |
| `title` | string | Blueprint | 无障碍 / 提示标题 |

## 构建器无关说明

核心 `<blueprint-viewer>` 是浏览器原生自定义元素（light DOM），不依赖任何框架运行时：
VuePress、Astro、Hugo、原生 HTML 均可直接使用。渲染器与 CSS 已内联进
`dist/blueprint-viewer.js` 单文件，唯一的运行时输入是 `src` 指向的蓝图文本。
