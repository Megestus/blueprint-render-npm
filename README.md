# blueprint-render

面向 UE 美术 / 技术美术同学，初衷是让大家在写学习笔记时能直接嵌入**可交互、可缩放、可复制节点代码**的蓝图 / 材质图——解决截图分辨率低、还原麻烦的问题。
框架无关的 `<blueprint-viewer>` Web Component + BlueprintUE 增强渲染器，一套核心适配 VuePress / Astro / 原生 HTML 等任意构建器。

## 这是什么

- **core**：`<blueprint-viewer>` 自定义元素（light DOM），内置蓝图文本加载、渲染、
  「copy code」按钮、自动全图适配（All）、左下角操作提示、右下角水印。
- **渲染器**：基于 [BlueprintUE](https://github.com/blueprintue/blueprintue-self-hosted-edition) 官方
  render.js（MIT）的增强版，改动：左键拖动画布（原右键，避免浏览器手势冲突）、
  All 全图显示按钮、英文操作提示、水印缩小、默认 auto-fit 支持。
- **适配层**：`src/vuepress/BlueprintRender.vue`（VuePress 2）、`src/astro/BlueprintViewer.astro`。

## 快速开始

### 0. 准备蓝图文件

在 UE 编辑器中框选蓝图/材质节点 → 复制 → 粘贴保存为 `.txt` 文件，放到项目的 `public/blueprints/` 目录（构建时自动发布到站点根路径）。

### Astro（最简）

```bash
npm install blueprint-render
```

```astro
---
import BlueprintViewer from "blueprint-render/astro";
---

<BlueprintViewer src="/blueprints/xxx.txt" height="643" />
```

组件内部自动按需加载核心，无需手动引入脚本或 CSS。

### VuePress 2

```bash
npm install blueprint-render
```

1. 将 `node_modules/blueprint-render/src/vuepress/BlueprintRender.vue` 复制到项目的 `.vuepress/components/` 目录（VuePress 自动注册为全局组件）。
2. 在 Markdown 文章中直接使用：

```md
<BlueprintRender src="/blueprints/xxx.txt" height="643" />
```

核心在 `onMounted` 中动态 `import("blueprint-render")`，仅含组件的页面才加载，无警告。

### 原生 HTML / 其他构建器

**方式一：npm + 打包工具（推荐）**

```bash
npm install blueprint-render
```

```js
// 入口 JS 中引入一次即可注册自定义元素
import "blueprint-render";
```

```html
<blueprint-viewer src="/blueprints/xxx.txt" height="643"></blueprint-viewer>
```

**方式二：无构建器，直接用单文件**

将 `node_modules/blueprint-render/dist/blueprint-viewer.js`（约 330 KB，自包含 ESM）拷到站点静态目录，然后：

```html
<script type="module" src="/blueprint-render/blueprint-viewer.js"></script>
<blueprint-viewer src="/blueprints/xxx.txt" height="643"></blueprint-viewer>
```

## 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `src` | string | — | 蓝图文本文件 URL（与 `text` 二选一，`src` 优先） |
| `text` | string | — | 直接传入蓝图文本 |
| `height` | number | 643 | 渲染区域高度（px） |
| `name` | string | 自动从 src 提取 | 显示在 copy code 左侧的名称标签；不传则自动取 src 文件名（去路径、去扩展名） |
| `show-copy` | boolean | true | 显示「copy code」按钮 |
| `auto-fit` | boolean | true | 渲染完成后自动全图适配 |
| `title` | string | Blueprint | 无障碍 / 提示标题 |

## 交互说明

### 基础操作

| 操作 | 效果 |
|---|---|
| 左键拖拽空白处 | 平移画布 |
| Ctrl + 滚轮 | 缩放 |
| **All** 按钮 | 缩放适配全部节点 |
| **Reset** 按钮 | 重置缩放和平移 |
| **copy code** 按钮 | 复制原始蓝图文本（可直接粘贴回 UE 编辑器） |
| 左上角菜单（☰） | 另存为图片 |

### 子图导航（双击进入）

渲染器支持**双击节点进入子图**，面包屑会显示当前导航层级（`Graph > 节点名`），点击 `Graph` 回到顶层。

但子图只在**复制文本中嵌入了子节点**时才存在。以下是对照：

| 类型 | 能否双击进入 | 原因 |
|---|---|---|
| **折叠节点**（Collapse Nodes） | ✅ 能 | 子节点嵌入在复制文本中 |
| 蓝图宏（Macro） | ✅ 能 | 宏展开后的节点嵌入文本 |
| 动画状态机 | ✅ 能 | 子状态嵌入文本 |
| 材质函数调用（MaterialFunctionCall） | ❌ 不能 | 只存外部资产引用，内部节点不在复制文本里 |
| 材质层（Material Layer） | ❌ 不能 | 同上，外部资产引用 |

### 折叠节点技巧（材质图创建子图的唯一方式）

材质图里**材质函数不算子图**——它是独立资产，复制时只带引用。要在材质图里创建可双击进入的子图，用**折叠节点**：

1. 在材质编辑器中**框选**想要打包的几个节点
2. 右键 → **Collapse Nodes**（折叠节点）
3. 给折叠节点命名（双击标题可重命名）
4. 全选复制 → 粘贴保存为 `.txt`
5. 在渲染器中**双击折叠节点** → 进入子图，面包屑显示 `Graph > 节点名`
6. 点击 `Graph` → 回到顶层

折叠节点内部的节点会完整嵌入复制文本，因此渲染器可以正确进入和显示。

## 开发

```bash
npm install        # 无需任何依赖（构建脚本零依赖）
npm run build      # 生成 dist/blueprint-viewer.js（自包含单文件）
```

核心源码：`src/core/`（`render.js` / `render.css` 为单一事实来源，`blueprint-viewer.js` 为组件）。
构建产物 `dist/blueprint-viewer.js` 为自包含 ESM，可被 Vite / Astro / `<script type="module">` 直接使用。

## 后续计划

- **更多构建器适配层**：Hugo shortcode、VitePress、Hexo、Next.js / Nuxt 等框架的便捷封装组件。核心 `<blueprint-viewer>` 本身已构建器无关，任何支持自定义元素的站点都能直接通过 `<script type="module">` 引入使用。
- **渲染器增强**：更多 UE 新版本节点样式、大图性能优化、明暗主题适配。
- **工具链**：`.uasset` 文件直接解析集成（待官方 [uasset-reader-js](https://github.com/blueprintue/uasset-reader-js) 完善蓝图节点解析后）。

## 文档

- [VuePress 集成](docs/vuepress.md)
- [Astro 集成](docs/astro.md)
- [npm 发布说明](docs/npm-publish.md)

## 许可

MIT。渲染器版权归 BlueprintUE（见 `LICENSE.blueprintUE`），增强修改见
`src/core/render.js` 文件头声明。
