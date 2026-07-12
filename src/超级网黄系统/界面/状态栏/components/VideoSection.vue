<template>
  <div class="videos">
    <template v-if="!_.isEmpty(videos)">
      <div v-for="(video, id) in videos" :key="id" class="video" :class="{ open: opened[id] }">
        <button class="video-head" type="button" @click="toggle(id as string)">
          <span class="thumb">🎞️</span>
          <span class="video-main">
            <span class="video-title" :class="{ blank: isBlank(video.视频标题) }">{{ blank(video.视频标题) }}</span>
            <span class="video-time" :class="{ blank: isBlank(video.发布时间) }">🗓 {{ blank(video.发布时间) }}</span>
          </span>
          <span class="plays">▶ {{ num(video.播放量) }}</span>
          <span class="v-chevron">⌄</span>
        </button>

        <div class="video-body">
          <div class="video-inner">
            <div class="video-pad">
              <p class="video-intro" :class="{ blank: isBlank(video.视频简介) }">简介 · {{ blank(video.视频简介) }}</p>

              <div v-if="!_.isEmpty(video.视频内容.参演人员)" class="cast">
                <span v-for="(person, pid) in video.视频内容.参演人员" :key="pid" class="cast-pill">{{
                  blank(person)
                }}</span>
              </div>

              <div class="content-row">
                <div class="content-box">
                  <div class="content-body" :class="{ blank: isBlank(video.视频内容.视频内容) }">
                    {{ blank(video.视频内容.视频内容) }}
                  </div>
                  <div class="content-foot">
                    <span class="cf-cell">
                      <span class="cf-key">视频时长</span>
                      <span class="cf-val" :class="{ blank: isBlank(video.时长) }">{{ blank(video.时长) }}</span>
                    </span>
                    <span class="cf-cell">
                      <span class="cf-key">演出地点</span>
                      <span class="cf-val" :class="{ blank: isBlank(video.视频内容.演出地点) }">{{
                        blank(video.视频内容.演出地点)
                      }}</span>
                    </span>
                  </div>
                </div>

                <div v-if="!_.isEmpty(video.视频内容.重要台词)" class="quotes">
                  <div v-for="(line, lid) in video.视频内容.重要台词" :key="lid" class="quote-bubble">
                    <span class="quote-speaker">{{ splitLine(line).speaker }}</span>
                    <span class="quote-text">「{{ splitLine(line).text }}」</span>
                  </div>
                </div>
              </div>

              <div class="comment-block">
                <span class="sub-head">💬 留言 <i>({{ _.size(video.留言) }})</i></span>
                <div v-if="!_.isEmpty(video.留言)" class="comments">
                  <div v-for="(comment, cid) in video.留言" :key="cid" class="comment">
                    <div class="comment-head">
                      <span class="comment-avatar">🐾</span>
                      <span class="comment-id">
                        <span class="comment-user" :class="{ blank: isBlank(comment.留言用户) }">{{
                          blank(comment.留言用户)
                        }}</span>
                        <span class="comment-time" :class="{ blank: isBlank(comment.留言时间) }">{{
                          blank(comment.留言时间)
                        }}</span>
                      </span>
                    </div>
                    <div class="comment-text" :class="{ blank: isBlank(comment.留言内容) }">
                      {{ blank(comment.留言内容) }}
                    </div>
                    <div v-if="!isBlank(comment.user的回复)" class="comment-reply">
                      <span class="reply-time">↳ {{ blank(comment.回复时间) }}</span>
                      <div class="reply-box">{{ blank(comment.user的回复) }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="mini-empty">还没有留言～</div>
              </div>

              <div class="tip-block">
                <span class="sub-head">🎁 打赏 <i>({{ _.size(video.打赏) }})</i></span>
                <div v-if="!_.isEmpty(video.打赏)" class="tips">
                  <span v-for="(tip, tid) in video.打赏" :key="tid" class="tip">
                    {{ blank(tip.打赏用户) }} <b>+{{ num(tip.打赏数额) }}</b>
                  </span>
                </div>
                <div v-else class="mini-empty">还没有打赏～</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty">还没有发布作品，快去拍第一支视频吧～</div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { reactive } from 'vue';
import { blank, isBlank, num } from '../format';
import { useDataStore } from '../store';

const store = useDataStore();
const videos = computed(() => store.data.视频信息);

const opened = reactive<Record<string, boolean>>({});
function toggle(id: string) {
  opened[id] = !opened[id];
}

function splitLine(line: unknown): { speaker: string; text: string } {
  const value = blank(line);
  const matched = value.match(/^([^：:]{1,20})[：:](.*)$/);
  if (!matched) {
    return { speaker: '旁白', text: value };
  }
  return {
    speaker: blank(matched[1]),
    text: blank(matched[2]),
  };
}
</script>

<style lang="scss" scoped>
.videos {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.video {
  background: rgba(255, 255, 255, 0.78);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius);
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.video.open {
  box-shadow: 0 6px 16px rgba(154, 130, 216, 0.24);
}

.video-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--sn-font);
  text-align: left;
}

.thumb {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  background: linear-gradient(135deg, #d9c8ff, #f3b6dc);
  border-radius: 11px;
}

.video-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.video-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--sn-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-time {
  font-size: 0.68rem;
  color: var(--sn-text-soft);
}

.plays {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--sn-lav-deep);
  background: rgba(185, 164, 236, 0.18);
  padding: 4px 11px;
  border-radius: 999px;
}

.v-chevron {
  flex-shrink: 0;
  color: var(--sn-lav-deep);
  font-size: 1rem;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.video.open .v-chevron {
  transform: rotate(180deg);
}

.video-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.video.open .video-body {
  grid-template-rows: 1fr;
}

.video-inner {
  overflow: hidden;
}

.video-pad {
  padding: 2px 12px 13px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.video-intro {
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--sn-text);
  padding: 8px 11px;
  background: rgba(185, 164, 236, 0.12);
  border: 1px solid var(--sn-card-line);
  border-radius: var(--sn-radius-sm);
}

.cast {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cast-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(120deg, var(--sn-lav), var(--sn-peri));
  border: none;
  padding: 5px 13px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(154, 130, 216, 0.3);
}

.content-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.content-box {
  flex: 1 1 210px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid var(--sn-card-line);
  border-radius: var(--sn-radius);
  overflow: hidden;
}

.content-body {
  padding: 14px 12px;
  min-height: 64px;
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--sn-text);
}

.content-foot {
  display: flex;
  border-top: 1.5px solid var(--sn-card-line);
}

.cf-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
}

.cf-cell:first-child {
  border-right: 1.5px solid var(--sn-card-line);
}

.cf-key {
  font-size: 0.64rem;
  color: var(--sn-text-soft);
}

.cf-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sn-text);
}

.quotes {
  flex: 1 1 150px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quote-bubble {
  display: flex;
  flex-direction: column;
  gap: 3px;
  position: relative;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--sn-lav-deep);
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px solid var(--sn-lav);
  border-radius: 12px;
  padding: 7px 10px;
}

.quote-speaker {
  align-self: flex-start;
  color: #fff;
  background: linear-gradient(120deg, var(--sn-lav), var(--sn-peri));
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.66rem;
  font-weight: 700;
}

.quote-text {
  color: var(--sn-lav-deep);
}

.sub-head {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sn-lav-deep);
  margin-bottom: 6px;
}

.sub-head i {
  font-style: normal;
  color: var(--sn-text-faint);
  font-weight: 600;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.comment {
  padding: 10px 11px;
  background: rgba(233, 224, 251, 0.45);
  border: 1px solid var(--sn-card-line);
  border-radius: 13px;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

.comment-avatar {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  background: radial-gradient(circle at 35% 30%, #d9c8ff, #a98fe0);
  border-radius: 50%;
}

.comment-id {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.comment-user {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sn-text);
}

.comment-time {
  font-size: 0.64rem;
  color: var(--sn-text-soft);
}

.comment-text {
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--sn-text);
  padding: 7px 10px;
  background: #fff;
  border: 1px solid var(--sn-card-line);
  border-radius: 9px;
}

.comment-reply {
  margin-top: 7px;
  padding-left: 14px;
  border-left: 2px solid var(--sn-lav);
}

.reply-time {
  display: block;
  font-size: 0.64rem;
  color: var(--sn-lav);
  margin-bottom: 4px;
}

.reply-box {
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--sn-lav-deep);
  font-weight: 600;
  padding: 7px 10px;
  background: rgba(185, 164, 236, 0.12);
  border: 1.5px solid var(--sn-lav);
  border-radius: 9px;
}

.tips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tip {
  font-size: 0.72rem;
  color: var(--sn-text);
  background: linear-gradient(120deg, rgba(255, 217, 122, 0.28), rgba(243, 182, 220, 0.22));
  border: 1px solid rgba(255, 217, 122, 0.5);
  padding: 3px 9px;
  border-radius: 999px;
}

.tip b {
  color: #c79a2e;
}

.mini-empty {
  font-size: 0.72rem;
  font-style: italic;
  color: var(--sn-text-faint);
  padding: 4px 2px;
}

.empty {
  text-align: center;
  font-size: 0.8rem;
  font-style: italic;
  color: var(--sn-text-faint);
  padding: 18px 12px;
}

.blank {
  color: var(--sn-text-faint);
  font-style: italic;
  font-weight: 600;
}
</style>
