/**
 * 通知酒馆助手：消息楼层 iframe 内容布局已稳定，用于父页面自动调整 iframe 高度。
 * 避免首次打开时仍是「扁」的，需点击后才展开。
 */

function emitRenderEnded(): void {
  try {
    void eventEmit(iframe_events.MESSAGE_IFRAME_RENDER_ENDED, getIframeName());
  } catch {
    /* 非楼层 iframe / 接口不可用时忽略 */
  }
}

const debouncedEmit = (() => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t !== undefined) {
      clearTimeout(t);
    }
    t = setTimeout(() => {
      t = undefined;
      emitRenderEnded();
    }, 120);
  };
})();

/**
 * 在 React 挂载后对根节点建立监听，并在多帧后多次通知（应对字体、异步数据与 flex 布局延迟）。
 */
export function attachIframeLayoutNotify(root: HTMLElement): () => void {
  emitRenderEnded();

  const raf = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      emitRenderEnded();
    });
  });

  const timeouts = [0, 50, 150, 400, 800].map(ms =>
    window.setTimeout(() => emitRenderEnded(), ms),
  );

  const ro = new ResizeObserver(() => {
    debouncedEmit();
  });
  ro.observe(root);
  if (document.body !== root) {
    ro.observe(document.body);
  }

  return () => {
    cancelAnimationFrame(raf);
    timeouts.forEach(clearTimeout);
    ro.disconnect();
  };
}
