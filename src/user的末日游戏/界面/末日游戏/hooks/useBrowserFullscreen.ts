import { useCallback, useEffect, useRef, useState } from 'react';

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function getFullscreenElement(doc: Document): Element | null {
  const d = doc as FsDocument;
  return doc.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function getRelevantDocuments(): Document[] {
  const docs: Document[] = [document];
  try {
    if (window.parent && window.parent !== window) {
      docs.push(window.parent.document);
    }
  } catch {
    /* 跨域父页不可访问 */
  }
  return docs;
}

function isTargetFullscreen(root: HTMLElement | null): boolean {
  const frame = window.frameElement as Element | null;
  for (const doc of getRelevantDocuments()) {
    const active = getFullscreenElement(doc);
    if (!active) {
      continue;
    }
    if (active === frame || active === root || active === document.documentElement) {
      return true;
    }
    if (root && active.contains(root)) {
      return true;
    }
  }
  return false;
}

async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const target = el as FsElement;
  if (target.requestFullscreen) {
    await target.requestFullscreen();
    return;
  }
  if (target.webkitRequestFullscreen) {
    await target.webkitRequestFullscreen();
    return;
  }
  throw new Error('当前浏览器不支持全屏 API');
}

async function exitAnyFullscreen(): Promise<void> {
  for (const doc of getRelevantDocuments()) {
    const active = getFullscreenElement(doc);
    if (!active) {
      continue;
    }
    const d = doc as FsDocument;
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (d.webkitExitFullscreen) {
      await d.webkitExitFullscreen();
    }
  }
}

function resolveFullscreenTarget(root: HTMLElement | null): HTMLElement {
  const frame = window.frameElement;
  if (frame instanceof HTMLElement) {
    return frame;
  }
  if (root) {
    return root;
  }
  return document.documentElement;
}

export function useBrowserFullscreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  /** 浏览器全屏不可用时的 CSS 铺满回退 */
  const [layoutExpanded, setLayoutExpanded] = useState(false);

  const syncActive = useCallback(() => {
    setActive(isTargetFullscreen(rootRef.current));
  }, []);

  useEffect(() => {
    syncActive();
    const onChange = () => syncActive();
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange as EventListener);

    let parentDoc: Document | null = null;
    try {
      parentDoc = window.parent?.document ?? null;
    } catch {
      parentDoc = null;
    }
    parentDoc?.addEventListener('fullscreenchange', onChange);
    parentDoc?.addEventListener('webkitfullscreenchange', onChange as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange as EventListener);
      parentDoc?.removeEventListener('fullscreenchange', onChange);
      parentDoc?.removeEventListener('webkitfullscreenchange', onChange as EventListener);
    };
  }, [syncActive]);

  const toggleFullscreen = useCallback(async () => {
    if (isTargetFullscreen(rootRef.current)) {
      try {
        await exitAnyFullscreen();
      } catch (e) {
        console.warn('[全屏] 退出失败', e);
      }
      setLayoutExpanded(false);
      return;
    }

    const target = resolveFullscreenTarget(rootRef.current);
    try {
      await requestElementFullscreen(target);
      setLayoutExpanded(false);
    } catch (e) {
      console.warn('[全屏] 浏览器全屏失败，使用界面铺满回退', e);
      setLayoutExpanded(true);
      toastr.info('当前环境无法调用系统全屏，已改为界面内铺满', '', { timeOut: 4000 });
    }
  }, []);

  const fullscreen = active || layoutExpanded;

  return {
    rootRef,
    fullscreen,
    isBrowserFullscreen: active,
    toggleFullscreen,
  };
}
