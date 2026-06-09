/**
 * 系统商城：每当 世界.生存天数 前进，强制整表刷新为基础生存物资（十项）。
 * 由脚本写入 stat_data，LLM 勿手改 系统商城 / _商城刷新于天数。
 */

import { klona } from 'klona';
import { TH_DUAL_API_NOTIFY } from '../../dualApiEvents';
import type { Schema } from '../../schema';
import { rollSystemShop } from './rollSystemShop';

const DEBOUNCE_MS = 500;
let timer: ReturnType<typeof setTimeout> | null = null;

function latestMvuOpt(): VariableOption {
  return { type: 'message', message_id: 'latest' };
}

function readSurvivalDay(stat: Schema): number {
  return Math.max(1, Math.floor(Number(stat.世界?.生存天数 ?? 1)));
}

function readLastShopRefreshDay(stat: Schema): number {
  return Math.max(0, Math.floor(Number(stat.交易行?._商城刷新于天数 ?? 0)));
}

async function syncShopForSurvivalDay(): Promise<void> {
  await waitGlobalInitialized('Mvu');

  const opt = latestMvuOpt();
  const oldData = Mvu.getMvuData(opt);
  if (!oldData?.stat_data || typeof oldData.stat_data !== 'object') {
    return;
  }

  const stat = klona(oldData.stat_data) as Schema;
  const day = readSurvivalDay(stat);
  const lastRefresh = readLastShopRefreshDay(stat);

  if (!stat.交易行) {
    stat.交易行 = { 系统商城: {}, 玩家交易: {}, _商城刷新于天数: 0 };
  }

  const existingKeys = Object.keys(stat.交易行.系统商城 ?? {}).length;

  if (day <= lastRefresh) {
    return;
  }

  // 旧存档无标记但已有 initvar 货架：只补标记，避免开局重复刷新
  if (lastRefresh === 0 && existingKeys > 0 && day === 1) {
    stat.交易行._商城刷新于天数 = day;
    await Mvu.replaceMvuData({ ...oldData, stat_data: stat }, opt);
    console.info('[商城刷新] 已补写 _商城刷新于天数=1（沿用现有货架）');
    return;
  }

  stat.交易行.系统商城 = rollSystemShop(day);
  stat.交易行._商城刷新于天数 = day;

  await Mvu.replaceMvuData({ ...oldData, stat_data: stat }, opt);
  console.info('[商城刷新] 生存天数', day, '→ 已刷新系统商城（10 项基础生存物资）');
}

function scheduleShopSync() {
  if (timer !== null) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = null;
    errorCatched(syncShopForSurvivalDay)();
  }, DEBOUNCE_MS);
}

$(() => {
  console.info('[商城刷新] 已加载：生存天数前进时自动刷新系统商城');

  const subs = [
    eventOn(tavern_events.GENERATION_ENDED, scheduleShopSync),
    eventOn(tavern_events.MESSAGE_UPDATED, scheduleShopSync),
    eventOn(tavern_events.MESSAGE_RECEIVED, scheduleShopSync),
    eventOn(tavern_events.CHAT_CHANGED, scheduleShopSync),
    eventOn(TH_DUAL_API_NOTIFY, scheduleShopSync),
  ];

  scheduleShopSync();

  $(window).on('pagehide', () => {
    subs.forEach(s => s.stop());
    if (timer !== null) {
      clearTimeout(timer);
    }
  });
});
