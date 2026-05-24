/**
 * 组装第二路 generateRaw 使用的提示词（纯文本，写入一条 role=user 或拆成多段）
 */

import { WB_ENTRY_ALIASES } from '../../界面/末日游戏/worldbookOutputMode';

export function findEntryContent(
  worldbook: { name: string; content: string }[],
  entryName: string,
): string {
  const n = entryName.trim();
  const e = worldbook.find(x => x.name.trim() === n);
  return e?.content?.trim() ?? '';
}

/** 同一逻辑条目多种标题时，按别名顺序取第一个有正文的 */
export function findFirstMatchingEntryContent(
  worldbook: { name: string; content: string }[],
  aliases: readonly string[],
): { title: string; content: string } | null {
  for (const title of aliases) {
    const body = findEntryContent(worldbook, title);
    if (body) {
      return { title, content: body };
    }
  }
  return null;
}

/**
 * 从 stat_data 中拆出「世界大势 / 论坛 / 排行 / 交易 / 任务 / 副本」等，供第二路参考
 */
export function formatAuxiliaryStatContext(stat: unknown): string {
  if (!stat || typeof stat !== 'object') {
    return '（无 stat_data）';
  }
  const s = stat as Record<string, unknown>;
  const parts: string[] = [];
  if (s.世界) {
    parts.push('【世界 / 日期天气地点等】\n' + JSON.stringify(s.世界, null, 2));
  }
  if (s.任务列表 && Object.keys(s.任务列表 as object).length) {
    parts.push('【任务列表】\n' + JSON.stringify(s.任务列表, null, 2));
  }
  if (s.玩家论坛) {
    parts.push('【玩家论坛 / 私信】\n' + JSON.stringify(s.玩家论坛, null, 2));
  }
  if (s.排行榜 && Object.keys(s.排行榜 as object).length) {
    parts.push('【排行榜】\n' + JSON.stringify(s.排行榜, null, 2));
  }
  if (s.交易行) {
    parts.push('【交易行】\n' + JSON.stringify(s.交易行, null, 2));
  }
  if (s.副本列表 && Object.keys(s.副本列表 as object).length) {
    parts.push('【副本列表】\n' + JSON.stringify(s.副本列表, null, 2));
  }
  if (s.狩猎名单) {
    parts.push('【狩猎 / 居民相关】\n' + JSON.stringify(s.狩猎名单, null, 2));
  }
  return parts.length > 0 ? parts.join('\n\n') : '（无扩展区块或均为空）';
}

export function buildOrderedDualSecondPrompt(args: {
  maintextInner: string;
  worldbook: { name: string; content: string }[];
  statDataJson: string;
  auxiliaryContext: string;
}): { system: string; user: string } {
  const injected: { label: string; aliases: readonly string[] }[] = [
    { label: '变量列表', aliases: WB_ENTRY_ALIASES.variableList },
    { label: '变量更新规则', aliases: WB_ENTRY_ALIASES.updateRules },
    { label: '变量输出格式', aliases: WB_ENTRY_ALIASES.mvuOutputFormat },
  ];

  const blocks: string[] = [];
  for (const { label, aliases } of injected) {
    const hit = findFirstMatchingEntryContent(args.worldbook, aliases);
    const heading = hit?.title ?? label;
    const body = hit?.content ?? '';
    blocks.push(`### ${heading}\n${body || '（未找到该条目或内容为空）'}`);
  }

  const subFmt = findFirstMatchingEntryContent(args.worldbook, [
    ...WB_ENTRY_ALIASES.dualSubFormat,
  ]);
  const subHeading = subFmt?.title ?? '多api输出格式-副';
  const subBody =
    subFmt?.content ??
    '（未找到《多api输出格式-副》条目；请在世界书中添加该条目并撰写副 API 输出约定。）';
  blocks.push(`### ${subHeading}\n${subBody}`);

  const system = [
    '你是「第二路 API」，仅负责《末日游戏》的 MVU 变量 JSON Patch 输出。',
    '主 API 已完成 `<maintext>`；行动选项仅存在于主 API 的 `<option>`，变量表中已无「下一步行动」——禁止对 `/下一步行动` 打补丁。',
    '你必须遵守下方已注入的《变量列表》《变量更新规则》《变量输出格式》及《多api输出格式-副》全文。',
  ].join('\n');

  const user = [
    '## 一、本回合正文（主 API 最新 `<maintext>` 内文本）',
    args.maintextInner || '（空）',
    '',
    '## 二、世界书原文（变量规则 + 副 API 输出约定）',
    blocks.join('\n\n'),
    '',
    '## 三、当前楼层 stat_data 快照（JSON）',
    args.statDataJson,
    '',
    '## 四、其它结构化状态（大势 / 论坛 / 排行 / 交易 / 副本 / 狩猎等）',
    args.auxiliaryContext,
    '',
    '请仅输出本回合所需的 `<UpdateVariable>` 块（无剧情复述）。',
  ].join('\n');

  return { system, user };
}
