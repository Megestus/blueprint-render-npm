<template>
  <div v-if="!loadError" ref="host" class="blueprint-render__host"></div>
  <div v-else class="blueprint-render__load-error">{{ loadError }}</div>
</template>

<script setup lang="ts">
/**
 * BlueprintRender — VuePress 2 薄壳（与旧版同名，博客文章零改动）
 *
 * 接入方式（npm 包）：
 *   pnpm add blueprint-render
 *   本文件放到项目 .vuepress/components/ 并照常在 client.ts 注册即可。
 *   核心在 onMounted 中按需动态 import（仅含 <BlueprintRender> 的页面才加载）。
 *
 * 说明：<blueprint-viewer> 在 onMounted 中程序化创建（不经 Vue 模板编译器），
 * 无需 isCustomElement / bundler 配置，无组件解析警告。
 * 另一种部署方式（无包管理，拷贝 dist 单文件）见 docs/vuepress.md。
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vuepress/client";

const props = withDefaults(
  defineProps<{
    /** 蓝图文本文件路径（public 目录下，以 / 开头），如 "/blueprints/xxx.txt" */
    src?: string;
    /** 直接传入蓝图文本（与 src 二选一，src 优先） */
    text?: string;
    /** 渲染区域高度（px），与官方渲染页默认一致 */
    height?: number;
    /** 是否显示「copy code」按钮（顶部菜单栏 Zoom 左侧） */
    showCopy?: boolean;
    /** 渲染完成后是否自动全图适配（All）显示 */
    autoFit?: boolean;
    /** 无障碍/提示用标题 */
    title?: string;
  }>(),
  {
    src: undefined,
    text: undefined,
    height: 643,
    showCopy: true,
    autoFit: true,
    title: "Blueprint",
  },
);

const host = ref<HTMLElement | null>(null);
const loadError = ref("");

let viewer: HTMLElement | null = null;

const resolvedSrc = computed(() => (props.src ? withBase(props.src) : undefined));

let viewerLoading: Promise<void> | null = null;

/** 按需加载核心（npm 包方式：动态 import 自动分包） */
function loadViewer(): Promise<void> {
  if (window.customElements.get("blueprint-viewer")) return Promise.resolve();
  if (viewerLoading) return viewerLoading;
  viewerLoading = import("blueprint-render").catch((e) => {
    viewerLoading = null;
    throw e;
  });
  return viewerLoading;
}

/** 创建 <blueprint-viewer> 并挂载（connectedCallback 触发渲染） */
function mountViewer() {
  if (!host.value || viewer) return;
  viewer = document.createElement("blueprint-viewer");
  if (resolvedSrc.value) viewer.setAttribute("src", resolvedSrc.value);
  if (props.text) viewer.setAttribute("text", props.text);
  viewer.setAttribute("height", String(props.height));
  viewer.setAttribute("show-copy", props.showCopy === false ? "false" : "true");
  viewer.setAttribute("auto-fit", props.autoFit === false ? "false" : "true");
  viewer.setAttribute("title", props.title);
  host.value.appendChild(viewer);
}

onMounted(async () => {
  try {
    await loadViewer();
    mountViewer();
  } catch (e) {
    loadError.value = (e as Error).message;
  }
});

onBeforeUnmount(() => {
  viewer?.remove();
  viewer = null;
});
</script>

<style scoped>
.blueprint-render__load-error {
  margin: 1rem 0;
  padding: 8px 12px;
  font-size: 13px;
  color: #fff;
  background: rgba(220, 38, 38, 0.92);
  border-radius: 8px;
}
</style>
