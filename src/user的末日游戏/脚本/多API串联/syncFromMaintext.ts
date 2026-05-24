import { klona } from 'klona';
import { parseMaintext, stripThinkingBlocks } from '../../界面/末日游戏/utils/messageParser';
import { isOpeningMessageFloor } from './openingFloor';
import { buildUidFromPlayerName, isBlankField, isPlaceholderUid, resolvePlayerDisplayName } from './uidFromName';

function extractLocation(text: string): string | undefined {
  const corner = text.match(/『\s*([^』|｜]+?)\s*』/);
  if (corner?.[1]?.trim()) {
    return corner[1].trim().slice(0, 48);
  }
  const named = text.match(
    /([\u4e00-\u9fa5A-Za-z0-9·]{2,24}?(?:出租屋|公寓|小区|大厦|酒店|学校|教室|医院|营地|废墟)[^\s，。！？|｜]{0,12})/,
  );
  if (named?.[1]?.trim()) {
    return named[1].trim().slice(0, 48);
  }
  return undefined;
}

function extractWeather(text: string): string | undefined {
  if (/阴霾|灰霾|雾霾/.test(text)) {
    return '阴霾';
  }
  if (/暴雨|大雨/.test(text)) {
    return '暴雨';
  }
  if (/细雨|小雨|雨/.test(text)) {
    return '细雨';
  }
  if (/阴|乌云/.test(text)) {
    return '阴云';
  }
  if (/晴|阳光/.test(text)) {
    return '晴朗';
  }
  return undefined;
}

function extractSeason(text: string): string | undefined {
  if (/深冬|严冬/.test(text)) {
    return '深冬';
  }
  if (/初冬/.test(text)) {
    return '初冬';
  }
  if (/盛夏|酷暑/.test(text)) {
    return '盛夏';
  }
  if (/初夏|晚春|暮春/.test(text)) {
    return '初夏';
  }
  if (/深秋|晚秋/.test(text)) {
    return '深秋';
  }
  return undefined;
}

function narrativeText(raw: string): string {
  const main = parseMaintext(raw);
  if (main) {
    return main;
  }
  return stripThinkingBlocks(raw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 第二路 Patch 未写入时，从正文兜底同步地点/天气/季节/UID */
export async function syncStatFromAssistantMessage(message_id: number): Promise<boolean> {
  if (isOpeningMessageFloor(message_id)) {
    return false;
  }

  await waitGlobalInitialized('Mvu');

  const row = getChatMessages(message_id)[0];
  if (!row || row.role !== 'assistant') {
    return false;
  }

  const text = narrativeText(row.message ?? '');
  if (!text) {
    return false;
  }

  const patch = {
    地点: extractLocation(text),
    天气: extractWeather(text),
    季节: extractSeason(text),
  };

  const opt: VariableOption = { type: 'message', message_id };
  let mvu: Mvu.MvuData;
  try {
    mvu = Mvu.getMvuData(opt);
  } catch {
    return false;
  }

  const next = klona(mvu);
  if (!next.stat_data || typeof next.stat_data !== 'object') {
    next.stat_data = {};
  }
  const root = next.stat_data as Record<string, unknown>;
  if (!root.世界 || typeof root.世界 !== 'object') {
    root.世界 = {};
  }
  if (!root.主角 || typeof root.主角 !== 'object') {
    root.主角 = {};
  }
  const w = root.世界 as Record<string, unknown>;
  const p = root.主角 as Record<string, unknown>;
  let changed = false;

  for (const key of ['地点', '天气', '季节'] as const) {
    const val = patch[key];
    if (!val) {
      continue;
    }
    const cur = String(w[key] ?? '');
    if (isBlankField(cur) || !text.includes(cur)) {
      w[key] = val;
      changed = true;
    }
  }

  const name = resolvePlayerDisplayName(p.姓名);
  if (!p.姓名 || String(p.姓名).includes('{{user}}')) {
    p.姓名 = name;
    changed = true;
  }
  if (isPlaceholderUid(p.uid)) {
    p.uid = await buildUidFromPlayerName(name);
    changed = true;
  }

  if (!changed) {
    return false;
  }

  await Mvu.replaceMvuData(next, opt);
  console.info('[多API串联] 正文兜底已写入 stat_data', { 地点: w.地点, 天气: w.天气, uid: p.uid });
  return true;
}
