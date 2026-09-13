# VuePress 2 集成

`blueprint-render` 提供与旧版 `BlueprintRender.vue` **同名**的薄壳，博客文章
`<BlueprintRender src="/blueprints/xxx.txt" />` 完全不用改。

## 方式一：npm 包（推荐）

```bash
# 在 blogmain 项目里
pnpm add blueprint-render
```

1. 把 `src/vuepress/BlueprintRender.vue` 放到 `.vuepress/components/`（覆盖旧版即可）。
2. `client.ts` 照常注册：

```ts
import BlueprintRender from "./components/BlueprintRender.vue";
// ...
app.component("BlueprintRender", BlueprintRender);
```

3. 核心在 `onMounted` 中**按需动态 import**（`import("blueprint-render")`），
   只有含 `<BlueprintRender>` 的页面才会加载渲染器，其他页面零负担。
4. 蓝图 `.txt` 文件仍放 `src/blueprints/`（由 config 插件发布到 `/blueprints/`）。

> 实现说明：`<blueprint-viewer>` 由薄壳在 `onMounted` 中**程序化创建**并挂载
> （`document.createElement("blueprint-viewer")`），不经过 Vue 模板编译器，
> 因此无需 `isCustomElement` / bundler 配置，也不会产生组件解析警告；
> 渲染器「另存为图片」依赖 `document.styleSheets`，核心使用 light DOM 而非
> Shadow DOM，行为与旧版完全一致。

## 方式二：部署产物（无包管理）

如果不想引入 npm 依赖（例如仓库之间用 Gitea 直接联动）：

1. 在 `blueprint-render` 仓库执行 `npm run build`。
2. 把 `dist/blueprint-viewer.js` 拷到 blogmain 的 `.vuepress/public/blueprint-render/`：

```bash
Copy-Item ../blueprint-render/dist/blueprint-viewer.js src/.vuepress/public/blueprint-render/
```

3. 薄壳改为动态 `<script type="module">` 加载（替换 `loadViewer`）：

```ts
function loadViewer(): Promise<void> {
  if (window.customElements.get("blueprint-viewer")) return Promise.resolve();
  if (viewerLoading) return viewerLoading;
  viewerLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = withBase("/blueprint-render/blueprint-viewer.js");
    script.onload = () => resolve();
    script.onerror = () => {
      viewerLoading = null;
      reject(new Error("blueprint-render 核心资源加载失败，请检查 /blueprint-render/ 是否已部署"));
    };
    document.head.appendChild(script);
  });
  return viewerLoading;
}
```

`dist/blueprint-viewer.js` 是自包含单文件（渲染器 + CSS 已内联），无需部署
`/bue-render/` 目录；`src/blueprints/_README.md` 中关于 `bue-render` 的说明可同步更新。

## 属性映射（与旧版一致）

| 旧版 prop | 新组件属性 | 默认 |
|---|---|---|
| `src` | `src`（经 `withBase` 解析） | — |
| `text` | `text` | — |
| `height` | `height` | 643 |
| `showCopy` | `show-copy` | true |
| `autoFit` | `auto-fit` | true |
| `title` | `title` | Blueprint |
