/**
 * build.mjs — 产出自包含的 dist/blueprint-viewer.js
 *
 * 拼接顺序（全部零依赖，Node 原生即可）：
 *   1. src/core/render.js（BlueprintUE 增强渲染器，IIFE，注册 window.blueprintUE.render.Main）
 *   2. const __BUE_RENDER_CSS__ = "<render.css 转义文本>"
 *   3. src/core/blueprint-viewer.js（<blueprint-viewer> Web Component 源码）
 *
 * 产物为单个 ESM 文件，可被 Vite / Astro / 原生 <script type="module"> 直接使用。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const renderJs = readFileSync(join(root, "src", "core", "render.js"), "utf8");
const renderCss = readFileSync(join(root, "src", "core", "render.css"), "utf8");
const viewer = readFileSync(join(root, "src", "core", "blueprint-viewer.js"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const header = [
  `// blueprint-render v${pkg.version} — 自包含 UE 蓝图 / 材质图查看器`,
  "// 构成：BlueprintUE render.js（MIT，含增强修改）+ render.css + <blueprint-viewer> Web Component",
  "// 重新生成：npm run build（scripts/build.mjs）",
  "",
].join("\n");

const out = [
  header,
  renderJs.trim(),
  `const __BUE_RENDER_CSS__ = ${JSON.stringify(renderCss)};`,
  viewer.trim(),
].join("\n\n");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "blueprint-viewer.js"), out);
console.log(
  `✔ dist/blueprint-viewer.js（${(out.length / 1024).toFixed(1)} KB，${out.split("\n").length} 行）`,
);
