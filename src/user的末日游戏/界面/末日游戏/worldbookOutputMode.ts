/**
 * 按输出模式切换世界书条目启用状态（单 API / 双 API）
 */

/**
 * 同一逻辑条目在世界书里可能出现的「标题」写法（须与世界书列表中的标题**完全一致**）。
 */
export const WB_ENTRY_ALIASES = {
  variableList: ['变量列表'],
  updateRules: ['[mvu_update]变量更新规则', '变量更新规则'],
  mvuOutputFormat: ['[mvu_update]变量输出格式', '变量输出格式'],
  singleApiFormat: ['单API输出格式', '单api输出格式'],
  /** 旧版单条「多api输出格式」；双 API 时须关闭，避免与 -主/-副 重复 */
  dualLegacySingle: ['多API输出格式', '多api输出格式'],
  dualMainFormat: ['多API输出格式-主', '多api输出格式-主'],
  dualSubFormat: ['多API输出格式-副', '多api输出格式-副'],
} as const satisfies Record<string, readonly string[]>;

function flattenAliasNames(): string[] {
  return Object.values(WB_ENTRY_ALIASES).flat();
}

/** @deprecated 请用 WB_ENTRY_ALIASES */
export const WB_SINGLE_API_ENTRIES = [
  ...WB_ENTRY_ALIASES.variableList,
  ...WB_ENTRY_ALIASES.updateRules,
  ...WB_ENTRY_ALIASES.mvuOutputFormat,
  ...WB_ENTRY_ALIASES.singleApiFormat,
] as const;

/** @deprecated 旧单条多 API 条目名 */
export const WB_DUAL_ONLY_ENTRY = WB_ENTRY_ALIASES.dualLegacySingle[0];

const ENTRY_MARKERS = new Set<string>(flattenAliasNames());

function nameIn(group: readonly string[], trimmedName: string): boolean {
  return group.some(x => x === trimmedName);
}

export function isSingleApiBundleEntry(trimmedName: string): boolean {
  const n = trimmedName;
  return (
    nameIn(WB_ENTRY_ALIASES.variableList, n) ||
    nameIn(WB_ENTRY_ALIASES.updateRules, n) ||
    nameIn(WB_ENTRY_ALIASES.mvuOutputFormat, n) ||
    nameIn(WB_ENTRY_ALIASES.singleApiFormat, n)
  );
}

function isDualMainEntry(trimmedName: string): boolean {
  return nameIn(WB_ENTRY_ALIASES.dualMainFormat, trimmedName);
}

function isDualSubEntry(trimmedName: string): boolean {
  return nameIn(WB_ENTRY_ALIASES.dualSubFormat, trimmedName);
}

function isLegacyDualSingleEntry(trimmedName: string): boolean {
  return nameIn(WB_ENTRY_ALIASES.dualLegacySingle, trimmedName);
}

/** 解析含有「变量 / 多API」相关条目的世界书（主绑角色卡或当前聊天） */
export async function resolveBoundWorldbookName(): Promise<string | null> {
  const tried = new Set<string>();
  const candidates: string[] = [];

  try {
    const { primary, additional } = getCharWorldbookNames('current');
    if (primary) {
      candidates.push(primary);
    }
    candidates.push(...additional);
  } catch {
    /* ignore */
  }

  try {
    const chatWb = getChatWorldbookName('current');
    if (chatWb) {
      candidates.push(chatWb);
    }
  } catch {
    /* ignore */
  }

  let fallback: string | null = null;
  for (const name of candidates) {
    if (!name || tried.has(name)) {
      continue;
    }
    tried.add(name);
    try {
      const wb = await getWorldbook(name);
      if (fallback === null) {
        fallback = name;
      }
      if (wb.some(e => ENTRY_MARKERS.has(e.name.trim()))) {
        return name;
      }
    } catch {
      /* */
    }
  }
  return fallback;
}

export async function applyWorldbookOutputMode(mode: 'single' | 'dual'): Promise<void> {
  const wbName = await resolveBoundWorldbookName();
  if (!wbName) {
    throw new Error('未找到角色卡或聊天绑定的世界书');
  }

  const enableSingle = mode === 'single';
  const enableDual = mode === 'dual';

  await updateWorldbookWith(
    wbName,
    entries =>
      entries.map(e => {
        const n = e.name.trim();
        if (isLegacyDualSingleEntry(n)) {
          return { ...e, enabled: false };
        }
        if (isSingleApiBundleEntry(n)) {
          return { ...e, enabled: enableSingle };
        }
        if (isDualMainEntry(n) || isDualSubEntry(n)) {
          return { ...e, enabled: enableDual };
        }
        return e;
      }),
    { render: 'immediate' },
  );
}
