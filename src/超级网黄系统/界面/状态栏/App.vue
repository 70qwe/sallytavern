<template>
  <div class="sn-wrap">
    <div class="sn-sky" aria-hidden="true">
      <span class="star s1">✦</span>
      <span class="star s2">✧</span>
      <span class="star s3">·</span>
      <span class="star s4">✦</span>
      <span class="star s5">✧</span>
      <span class="star s6">·</span>
      <span class="cloud c1"></span>
      <span class="cloud c2"></span>
    </div>

    <div class="sn-card">
      <ProfileHeader />

      <div class="sn-sections">
        <CollapseSection storage-key="reality" icon="🌙" title="现实世界" :open-default="true">
          <RealitySection />
        </CollapseSection>

        <CollapseSection storage-key="space" icon="🎬" title="专属空间" :sub="videoCountText" :open-default="false">
          <SpaceSection />
          <VideoSection />
        </CollapseSection>
      </div>

      <div class="sn-footer">💜 超级网黄系统</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import CollapseSection from './components/CollapseSection.vue';
import ProfileHeader from './components/ProfileHeader.vue';
import RealitySection from './components/RealitySection.vue';
import SpaceSection from './components/SpaceSection.vue';
import VideoSection from './components/VideoSection.vue';
import { useDataStore } from './store';

const store = useDataStore();
const videoCountText = computed(() => `共 ${_.size(store.data.视频信息)} 部`);
</script>

<style lang="scss" scoped>
.sn-wrap {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  border-radius: 26px;
  overflow: hidden;
  font-family: var(--sn-font);
  color: var(--sn-text);
  background:
    radial-gradient(120% 70% at 80% 0%, rgba(243, 182, 220, 0.35), transparent 60%),
    radial-gradient(120% 80% at 10% 10%, rgba(169, 182, 242, 0.4), transparent 55%),
    linear-gradient(165deg, #5b4d82 0%, #4a3f6b 55%, #3d335c 100%);
  box-shadow: var(--sn-shadow);
}

.sn-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.star {
  position: absolute;
  color: #fff6d8;
  opacity: 0.85;
  text-shadow: 0 0 6px rgba(255, 246, 216, 0.9);
  animation: sn-twinkle 3s ease-in-out infinite;
}

.s1 {
  top: 8%;
  left: 12%;
  font-size: 12px;
  animation-delay: 0s;
}
.s2 {
  top: 16%;
  right: 16%;
  font-size: 10px;
  animation-delay: 0.6s;
}
.s3 {
  top: 30%;
  left: 26%;
  font-size: 16px;
  animation-delay: 1.1s;
}
.s4 {
  top: 6%;
  left: 60%;
  font-size: 9px;
  animation-delay: 1.5s;
}
.s5 {
  top: 22%;
  left: 45%;
  font-size: 11px;
  animation-delay: 2s;
}
.s6 {
  top: 12%;
  right: 38%;
  font-size: 15px;
  animation-delay: 0.3s;
}

.cloud {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(6px);
}

.cloud.c1 {
  width: 120px;
  height: 50px;
  top: -10px;
  left: -20px;
}

.cloud.c2 {
  width: 90px;
  height: 40px;
  top: 30px;
  right: -20px;
}

.sn-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.sn-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sn-footer {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px 0 2px;
}

@keyframes sn-twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@media (max-width: 380px) {
  .sn-wrap {
    padding: 12px;
  }
}
</style>
