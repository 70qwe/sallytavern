<template>
  <div class="sn-fold" :class="{ open }">
    <div
      class="sn-fold-head"
      role="button"
      tabindex="0"
      :aria-expanded="open"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="head-icon">{{ icon }}</span>
      <span class="head-title">{{ title }}</span>
      <span v-if="sub" class="head-sub">{{ sub }}</span>
      <span class="head-chevron">⌄</span>
    </div>
    <div class="sn-fold-body">
      <div class="sn-fold-inner">
        <div class="sn-fold-pad">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon: string;
    title: string;
    sub?: string;
    storageKey: string;
    openDefault?: boolean;
  }>(),
  { openDefault: false },
);

const STORAGE_KEY = `sn-status:${props.storageKey}`;

/** 折叠状态持久化, 但对 localStorage 访问做容错, 避免在受限 iframe 中抛错导致整块不渲染 */
function readPersisted(): boolean {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    return raw === null || raw === undefined ? props.openDefault : raw === 'true';
  } catch {
    return props.openDefault;
  }
}

const open = ref(readPersisted());

function toggle() {
  open.value = !open.value;
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(open.value));
  } catch {
    /* 受限环境下忽略持久化失败 */
  }
}
</script>

<style lang="scss" scoped>
/* 勿用 class="collapse"：酒馆内置 Bootstrap 会把 .collapse 设为 display:none */
.sn-fold {
  display: block;
  background: var(--sn-card);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius);
  box-shadow: var(--sn-shadow-soft);
  overflow: hidden;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
}

.sn-fold.open {
  box-shadow: 0 8px 20px rgba(154, 130, 216, 0.28);
}

.sn-fold-head {
  display: flex !important;
  width: 100%;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border: none;
  background: linear-gradient(120deg, rgba(185, 164, 236, 0.16), rgba(243, 182, 220, 0.14));
  color: var(--sn-text);
  font-family: var(--sn-font);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.25s ease;
}

.sn-fold-head:hover {
  background: linear-gradient(120deg, rgba(185, 164, 236, 0.28), rgba(243, 182, 220, 0.24));
}

.head-icon {
  font-size: 1.05rem;
  filter: drop-shadow(0 1px 2px rgba(154, 130, 216, 0.4));
}

.head-title {
  letter-spacing: 0.04em;
}

.head-sub {
  margin-left: 2px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--sn-lav-deep);
  background: rgba(185, 164, 236, 0.2);
  padding: 2px 8px;
  border-radius: 999px;
}

.head-chevron {
  margin-left: auto;
  font-size: 1.1rem;
  color: var(--sn-lav-deep);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.sn-fold.open .head-chevron {
  transform: rotate(180deg);
}

.sn-fold-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.sn-fold.open .sn-fold-body {
  grid-template-rows: 1fr;
}

.sn-fold-inner {
  overflow: hidden;
}

.sn-fold-pad {
  padding: 4px 14px 16px;
  opacity: 0;
  transform: translateY(-6px);
  transition:
    opacity 0.32s ease 0.05s,
    transform 0.32s ease 0.05s;
}

.sn-fold.open .sn-fold-pad {
  opacity: 1;
  transform: translateY(0);
}
</style>
