/**
 * <blueprint-viewer> — 框架无关的 UE 蓝图 / 材质图查看器（Web Component）
 *
 * 消费方式：使用构建产物 dist/blueprint-viewer.js（自包含 ESM，已内联
 * BlueprintUE 增强渲染器 render.js 与 render.css）。源码需要 `npm run build`
 * 产出 dist 后使用，构建顺序：render.js（注册 window.blueprintUE.render.Main）
 * → __BUE_RENDER_CSS__（CSS 文本常量）→ 本文件。
 *
 * 说明（为什么不用 Shadow DOM）：
 * 官方渲染器「另存为图片」功能通过 document.styleSheets 读取 .bue-render 样式
 * （见 render.js getRenderCssAsString），Shadow DOM 内样式不在 document.styleSheets
 * 中会导致导出图片无样式。因此本组件使用 light DOM + 全局注入 <style>，
 * 与在 VuePress 中的既有行为完全一致。
 *
 * 属性：
 *   src       蓝图文本文件 URL（相对/绝对，如 /blueprints/xxx.txt）
 *   text      直接传入蓝图文本（与 src 二选一，src 优先）
 *   height    容器高度 px（默认 643）
 *   show-copy 是否显示「copy code」按钮（默认 true）
 *   auto-fit  渲染完成后自动全图适配（默认 true）
 *   name      显示在 copy code 左侧的名称标签；不传则自动从 src 文件名提取
 *   title     无障碍 / 提示标题
 */

const BUE_STYLE_ID = "blueprint-render-styles";

if (typeof __BUE_RENDER_CSS__ === "undefined") {
  throw new Error(
    "[blueprint-viewer] 缺少构建产物：请先运行 npm run build 生成 dist/blueprint-viewer.js",
  );
}

// 注入渲染器样式 + 组件自身样式（全局单例，与 VuePress 既有行为一致）
if (!document.getElementById(BUE_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = BUE_STYLE_ID;
  style.textContent =
    __BUE_RENDER_CSS__ +
    "\n" +
    [
      ".blueprint-render{position:relative;margin:1rem 0;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.08)}",
      ".blueprint-render__container{width:100%;overflow:hidden;border-radius:8px;background:#a6a6a6}",
      ".blueprint-render__error{position:absolute;top:0;left:0;right:0;z-index:6;padding:8px 12px;font-size:13px;color:#fff;background:rgba(220,38,38,.92);border-radius:8px 8px 0 0}",
      ".frame-header__name-label{color:#fff;font-size:18px;padding:0 10px;pointer-events:none;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}",
    ].join("\n");
  document.head.appendChild(style);
}

/** 布尔属性解析：缺省用 fallback；"false"/"0" 为 false；其余（含裸属性）为 true */
function boolAttr(el, name, fallback) {
  const v = el.getAttribute(name);
  if (v === null || v === "") return fallback;
  return v !== "false" && v !== "0";
}

class BlueprintViewer extends HTMLElement {
  static get observedAttributes() {
    return ["src", "text", "height", "show-copy", "auto-fit", "name"];
  }

  connectedCallback() {
    if (!this._built) {
      this._built = true;
      this._build();
    }
    void this._render();
  }

  disconnectedCallback() {
    this._destroy();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this._built) return;
    if (name === "src" || name === "text") void this._render();
    if (name === "height") this._applyHeight();
  }

  _build() {
    this._wrapper = document.createElement("div");
    this._wrapper.className = "blueprint-render";

    this._container = document.createElement("div");
    this._container.className = "blueprint-render__container";
    this._container.setAttribute("role", "img");
    this._container.setAttribute(
      "aria-label",
      this.getAttribute("title") || "Blueprint graph",
    );
    this._wrapper.appendChild(this._container);

    this._error = document.createElement("div");
    this._error.className = "blueprint-render__error";
    this._error.style.display = "none";
    this._wrapper.appendChild(this._error);

    this.appendChild(this._wrapper);
    this._applyHeight();
  }

  _applyHeight() {
    if (!this._container) return;
    const raw = parseInt(this.getAttribute("height") || "643", 10);
    const h = Number.isFinite(raw) && raw > 0 ? raw : 643;
    this._container.style.height = `${h}px`;
  }

  _showError(message) {
    if (!this._error) return;
    this._error.textContent = message;
    this._error.style.display = "";
  }

  _hideError() {
    if (!this._error) return;
    this._error.style.display = "none";
  }

  async _loadText() {
    const src = this.getAttribute("src");
    const text = this.getAttribute("text");
    if (src) {
      const resp = await fetch(src);
      if (!resp.ok) {
        throw new Error(`蓝图文件加载失败（HTTP ${resp.status}）：${src}`);
      }
      return (await resp.text()).replace(/^\uFEFF/, "").trim();
    }
    if (text) return text.trim();
    throw new Error("请提供 src（蓝图文本文件路径）或 text（蓝图文本）");
  }

  _destroy() {
    try {
      this._renderer?.stop();
    } catch {
      /* 渲染器可能已处于清理状态 */
    }
    this._renderer = null;
  }

  async _render() {
    this._destroy();
    const Main = window.blueprintUE?.render?.Main;
    if (!Main) {
      this._showError("渲染器未加载（window.blueprintUE.render.Main 缺失）");
      return;
    }
    try {
      const raw = await this._loadText();
      this._blueprintText = raw;
      this._renderer = new Main(raw, this._container, {
        height: this._container.style.height || "643px",
      });
      this._renderer.start((ok, err) => {
        if (!ok) {
          this._showError(
            `蓝图解析失败：${(err && (err.message || err.displayedMessage)) || "未知错误"}`,
          );
          return;
        }
        this._hideError();
        this._mountCopyButton();
        this._autoFit();
      });
    } catch (e) {
      this._showError((e && e.message) || String(e));
    }
  }

  /** 解析显示名称：优先 name 属性，否则从 src 文件名提取（去路径去扩展名） */
  _resolveName() {
    const explicit = this.getAttribute("name");
    if (explicit && explicit.trim()) return explicit.trim();
    const src = this.getAttribute("src");
    if (!src) return "";
    const file = src.split("/").pop() || src;
    return file.replace(/\.[^.]+$/, "");
  }

  /** 把「copy code」按钮放进渲染器顶部菜单栏（Zoom 左侧），风格与渲染器统一 */
  _mountCopyButton() {
    if (!boolAttr(this, "show-copy", true)) return;
    const header = this._container.querySelector(".frame-header");
    if (!header || header.querySelector(".frame-header__buttons-copycode")) return;

    // 名称标签（copy code 左侧）
    const name = this._resolveName();
    if (name) {
      const label = document.createElement("div");
      label.className = "frame-header__name-label";
      label.textContent = name;
      label.title = name;
      const zoom = header.querySelector(".frame-header__current-zoom");
      if (zoom) header.insertBefore(label, zoom);
      else header.appendChild(label);
    }

    const btn = document.createElement("div");
    btn.className = "frame-header__buttons-copycode";
    btn.textContent = "copy code";
    btn.addEventListener("click", () => void this._copyCode(btn));

    const zoom = header.querySelector(".frame-header__current-zoom");
    if (zoom) header.insertBefore(btn, zoom);
    else header.appendChild(btn);
  }

  async _copyCode(btn) {
    const text = this._blueprintText;
    if (!text) return;
    try {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        // 内网 http 环境 / 剪贴板 API 不可用时 fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("复制失败");
      }
      if (btn) {
        const origin = btn.textContent;
        btn.textContent = "copied ✓";
        setTimeout(() => {
          btn.textContent = origin;
        }, 2000);
      }
    } catch (e) {
      this._showError(`复制失败：${(e && e.message) || "未知错误"}`);
    }
  }

  /** 渲染完成后自动执行一次全图适配（All），让全部节点默认完整显示 */
  _autoFit() {
    if (!boolAttr(this, "auto-fit", true)) return;
    // 双 rAF 等布局稳定后再触发（行为与用户点击 All 完全一致）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._container.querySelector(".frame-header__buttons-all")?.click();
      });
    });
  }
}

if (!customElements.get("blueprint-viewer")) {
  customElements.define("blueprint-viewer", BlueprintViewer);
}

export { BlueprintViewer };
