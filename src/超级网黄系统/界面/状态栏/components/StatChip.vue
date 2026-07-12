<template>
  <div class="stat-chip">
    <span class="stat-icon">{{ icon }}</span>
    <span class="stat-value">{{ value }}</span>
    <span class="stat-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value: string;
}>();
</script>

<style lang="scss" scoped>
.stat-chip {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 9px 6px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(239, 231, 253, 0.92));
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius-sm);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.25s ease;
}

.stat-chip:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(154, 130, 216, 0.3);
}

.stat-icon {
  font-size: 1.05rem;
  line-height: 1;
}

.stat-value {
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--sn-text);
  letter-spacing: 0.02em;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label {
  font-size: 0.66rem;
  color: var(--sn-text-soft);
  letter-spacing: 0.04em;
}
</style>
