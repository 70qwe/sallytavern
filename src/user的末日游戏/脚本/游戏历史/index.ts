/**
 * 监听新 assistant 楼层，将 <sum> 同步到世界书条目「玩家的游戏历史」。
 *
 * 说明：
 * - 世界书可能在「角色卡绑定」或「当前聊天文件绑定」下，两者都会尝试。
 * - GENERATION_ENDED 触发时消息有时尚未写入楼层，故配合 CHARACTER_MESSAGE_RENDERED，并在读取前短暂延迟。
 */

const ENTRY_NAME = '玩家的游戏历史';
/** 合并 CHARACTER_MESSAGE_RENDERED / GENERATION_ENDED 的多次触发，并在消息写入后再读楼层 */
const DEBOUNCE_MS = 180;

const SLOT_RE =
  /<!--\s*th_history_slot\s+n="(\d+)"\s*-->\s*([\s\S]*?)\s*<!--\s*\/th_history_slot\s*-->/gi;

function stripThinkingBlocks(content: string): string {
  let cleaned = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '');
  cleaned = cleaned.replace(/<redacted_reasoning>[\s\S]*?<\/redacted_reasoning>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

  const thinkingStart = cleaned.search(/<thinking\s*>/i);
  if (thinkingStart !== -1) {
    cleaned = cleaned.substring(0, thinkingStart);
  }
  const redactedThinkingStart = cleaned.search(/<redacted_thinking\s*>/i);
  if (redactedThinkingStart !== -1) {
    cleaned = cleaned.substring(0, redactedThinkingStart);
  }
  const redactedReasoningStart = cleaned.search(/<redacted_reasoning\s*>/i);
  if (redactedReasoningStart !== -1) {
    cleaned = cleaned.substring(0, redactedReasoningStart);
  }

  return cleaned;
}

function parseSumFromMessage(messageContent: string): string {
  if (!messageContent) {
    return '';
  }
  const cleaned = stripThinkingBlocks(messageContent);
  const matches = cleaned.match(/<sum\s*>([\s\S]*?)<\/sum\s*>/gi);
  if (!matches?.length) {
    return '';
  }
  const lastMatch = matches[matches.length - 1];
  const content = lastMatch.match(/<sum\s*>([\s\S]*?)<\/sum\s*>/i);
  return content?.[1]?.trim() ?? '';
}

function wrapSum(inner: string): string {
  return `<sum>${inner}</sum>`;
}

function parseSlots(content: string): Map<number, string> {
  const map = new Map<number, string>();
  const re = new RegExp(SLOT_RE.source, SLOT_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    map.set(Number(m[1]), m[2].trim());
  }
  return map;
}

function serializeSlots(slots: Map<number, string>): string {
  const header = `<!-- 玩家的游戏历史：由脚本维护。编号=floor(消息id/2)；自上而下为新→旧。 -->\n\n`;
  const keys = [...slots.keys()].sort((a, b) => b - a);
  if (keys.length === 0) {
    return `${header}`;
  }
  const blocks = keys.map(n => {
    const body = slots.get(n) ?? '';
    return `<!-- th_history_slot n="${n}" -->\n${body}\n<!-- /th_history_slot -->`;
  });
  return `${header}${blocks.join('\n\n')}`;
}

function storyIndexFromMessageId(messageId: number): number {
  return Math.floor(messageId / 2);
}

function normalizeMessageId(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : -1;
}

/** 角色卡主/附加世界书 + 当前聊天绑定的世界书中，查找包含目标条目的世界书名称 */
async function resolveWorldbookNameForEntry(): Promise<string | null> {
  const seen = new Set<string>();
  const candidates: string[] = [];

  try {
    const { primary, additional } = getCharWorldbookNames('current');
    if (primary) {
      candidates.push(primary);
    }
    candidates.push(...additional);
  } catch (e) {
    console.warn('[游戏历史] getCharWorldbookNames 失败', e);
  }

  try {
    const chatWb = getChatWorldbookName('current');
    if (chatWb) {
      candidates.push(chatWb);
    }
  } catch (e) {
    console.warn('[游戏历史] getChatWorldbookName 失败', e);
  }

  for (const name of candidates) {
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    try {
      const wb = await getWorldbook(name);
      if (wb.some(e => e.name.trim() === ENTRY_NAME)) {
        console.info(`[游戏历史] 使用世界书「${name}」`);
        return name;
      }
    } catch (e) {
      console.warn(`[游戏历史] 读取世界书「${name}」失败`, e);
    }
  }

  console.warn(
    `[游戏历史] 未在任何候选世界书中找到条目「${ENTRY_NAME}」。请确认条目名称完全一致，且世界书已绑定到当前角色或当前聊天。`,
  );
  return null;
}

async function applyHistoryUpdate(messageId: number): Promise<void> {
  let msgs = getChatMessages(messageId);
  if (!msgs[0]) {
    await new Promise<void>(r => setTimeout(r, 400));
    msgs = getChatMessages(messageId);
  }

  const msg = msgs[0];
  if (!msg) {
    console.warn(`[游戏历史] getChatMessages(${messageId}) 仍为空，跳过`);
    return;
  }
  if (msg.role !== 'assistant') {
    return;
  }

  const idx = storyIndexFromMessageId(messageId);
  const inner = parseSumFromMessage(msg.message ?? '');
  const sumBlock = wrapSum(inner);

  const wbName = await resolveWorldbookNameForEntry();
  if (!wbName) {
    return;
  }

  await updateWorldbookWith(
    wbName,
    entries => {
      const i = entries.findIndex(e => e.name.trim() === ENTRY_NAME);
      if (i === -1) {
        console.warn(`[游戏历史] 世界书「${wbName}」中未找到条目「${ENTRY_NAME}」`);
        return entries;
      }

      const slots = parseSlots(entries[i].content ?? '');
      const keys = [...slots.keys()];
      const maxKey = keys.length === 0 ? undefined : Math.max(...keys);

      const isRollback = slots.has(idx) && maxKey !== undefined && maxKey > idx;

      if (isRollback) {
        slots.set(idx, sumBlock);
        for (const k of keys) {
          if (k > idx) {
            slots.delete(k);
          }
        }
      } else {
        slots.set(idx, sumBlock);
      }

      const next = [...entries];
      next[i] = { ...next[i], content: serializeSlots(slots) };
      return next;
    },
    { render: 'immediate' },
  );

  console.info(`[游戏历史] 已写入世界书，编号=${idx} message_id=${messageId} sum长度=${inner.length}`);
}

const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();

function scheduleHistoryUpdate(rawId: unknown, source: string): void {
  const messageId = normalizeMessageId(rawId);
  if (messageId < 0) {
    console.warn('[游戏历史] 无效 message_id', rawId, source);
    return;
  }
  const prev = debounceTimers.get(messageId);
  if (prev !== undefined) {
    clearTimeout(prev);
  }
  debounceTimers.set(
    messageId,
    setTimeout(() => {
      debounceTimers.delete(messageId);
      void applyHistoryUpdate(messageId).catch(err => {
        console.warn('[游戏历史] 更新失败', source, err);
      });
    }, DEBOUNCE_MS),
  );
}

$(() => {
  console.info('[游戏历史] 脚本已加载（CHARACTER_MESSAGE_RENDERED + GENERATION_ENDED）');

  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (message_id, type) => {
    scheduleHistoryUpdate(message_id, `CHARACTER_MESSAGE_RENDERED:${type}`);
  });

  eventOn(tavern_events.GENERATION_ENDED, message_id => {
    scheduleHistoryUpdate(message_id, 'GENERATION_ENDED');
  });
});
