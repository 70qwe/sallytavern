<template>
  <header class="profile">
    <div class="profile-top">
      <div class="avatar" :class="{ living: isLiving }">
        <span class="avatar-face">🐱</span>
        <span class="avatar-moon">🌙</span>
        <span v-if="isLiving" class="live-ring"></span>
      </div>

      <div class="identity">
        <div class="name-row">
          <span class="account-name" :class="{ blank: isBlank(space.账号名称) }">{{ blank(space.账号名称) }}</span>
          <span class="live-badge" :class="{ on: isLiving }">
            <span class="live-dot"></span>{{ isLiving ? '直播中' : '未开播' }}
          </span>
        </div>
        <p class="signature" :class="{ blank: isBlank(space.个性签名) }">{{ blank(space.个性签名) }}</p>
      </div>
    </div>

    <div class="stat-row">
      <StatChip icon="🔥" label="人气值" :value="num(space.人气值)" />
      <StatChip icon="👥" label="粉丝量" :value="num(space.粉丝量)" />
      <StatChip icon="🎬" label="视频数" :value="num(space.视频数量)" />
      <StatChip icon="💎" label="总打赏" :value="num(space.总打赏)" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { blank, isBlank, num } from '../format';
import { useDataStore } from '../store';
import StatChip from './StatChip.vue';

const store = useDataStore();
const space = computed(() => store.data.空间信息);
const isLiving = computed(() => space.value.是否正在直播 === '是');
</script>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px 15px 16px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.96), rgba(233, 224, 251, 0.94));
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius-lg);
  box-shadow: var(--sn-shadow-soft);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 13px;
}

.avatar {
  position: relative;
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 30%, #d9c8ff, #a98fe0);
  box-shadow:
    0 4px 12px rgba(154, 130, 216, 0.45),
    inset 0 2px 5px rgba(255, 255, 255, 0.5);
}

.avatar-face {
  font-size: 1.7rem;
  filter: drop-shadow(0 1px 1px rgba(75, 63, 110, 0.25));
}

.avatar-moon {
  position: absolute;
  top: -4px;
  right: -3px;
  font-size: 0.85rem;
  animation: sn-bob 3.2s ease-in-out infinite;
}

.live-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--sn-live);
  animation: sn-pulse 1.8s ease-out infinite;
}

.identity {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.account-name {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--sn-text);
  letter-spacing: 0.02em;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  color: var(--sn-text-soft);
  background: rgba(182, 171, 209, 0.22);
  transition: all 0.3s ease;
}

.live-badge.on {
  color: #fff;
  background: linear-gradient(120deg, var(--sn-live), #ff9ec4);
  box-shadow: 0 3px 9px rgba(255, 127, 168, 0.45);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.live-badge.on .live-dot {
  background: #fff;
  animation: sn-blink 1.2s ease-in-out infinite;
}

.signature {
  margin-top: 4px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--sn-text-soft);
}

.stat-row {
  display: flex;
  gap: 8px;
}

.blank {
  color: var(--sn-text-faint);
  font-style: italic;
  font-weight: 600;
}

@keyframes sn-pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

@keyframes sn-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes sn-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg);
  }
  50% {
    transform: translateY(-3px) rotate(6deg);
  }
}
</style>
