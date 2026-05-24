/**
 * 多 API：主回复结束后自动跑第二路（变量），并解析/兜底写入 stat_data。
 * 界面设置选「双 API」并填写第二路 URL / Key / 模型。
 */

import { TH_DUAL_API_REROLL } from '../../dualApiEvents';
import { rerollDualSecondPass, runDualSecondPassIfNeeded } from './runDualSecondPass';

/** 主 API 落盘后再跑第二路 */
const DEBOUNCE_MS = 900;
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleSecondPass() {
  if (timer !== null) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    errorCatched(runDualSecondPassIfNeeded)();
  }, DEBOUNCE_MS);
}

$(() => {
  console.info('[多API串联] 已加载');

  const subs = [
    eventOn(tavern_events.GENERATION_ENDED, scheduleSecondPass),
    eventOn(TH_DUAL_API_REROLL, (message_id?: number) => {
      errorCatched(() => rerollDualSecondPass(message_id))();
    }),
  ];

  $(window).on('pagehide', () => {
    subs.forEach(s => s.stop());
    if (timer !== null) {
      clearTimeout(timer);
    }
  });
});
