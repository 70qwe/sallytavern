<template>
  <div class="space-sec">
    <div class="sub-head">✨ 当前装扮</div>
    <div class="dress-card">
      <span class="dress-quote">“</span>
      <p class="dress-text" :class="{ blank: isBlank(space.当前装扮) }">{{ blank(space.当前装扮) }}</p>
      <span class="dress-quote dress-quote-end">”</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { blank, isBlank } from '../format';
import { useDataStore } from '../store';

const store = useDataStore();
const space = computed(() => store.data.空间信息);
</script>

<style lang="scss" scoped>
.space-sec {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 12px;
}

.sub-head {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--sn-lav-deep);
  padding-left: 2px;
}

.dress-card {
  position: relative;
  padding: 14px 30px 22px 30px;
  background: linear-gradient(135deg, rgba(185, 164, 236, 0.16), rgba(169, 182, 242, 0.16));
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius);
}

.dress-quote {
  position: absolute;
  top: 2px;
  left: 9px;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--sn-lav);
  opacity: 0.55;
}

.dress-quote-end {
  top: auto;
  left: auto;
  right: 9px;
  bottom: 0;
}

.dress-text {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--sn-text);
}

.blank {
  color: var(--sn-text-faint);
  font-style: italic;
  font-weight: 600;
}
</style>
