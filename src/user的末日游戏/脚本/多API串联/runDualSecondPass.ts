/**
 * 主 API 完成后：generateRaw 第二路 → 合并进同楼 → 解析 UpdateVariable → 必要时正文兜底。
 */

import { buildDualSecondMaintextContext } from '../../界面/末日游戏/utils/messageParser';
import { resolveBoundWorldbookName } from '../../界面/末日游戏/worldbookOutputMode';
import { loadUiSettingsFromChat } from '../../界面/末日游戏/uiSettings';
import { applyMvuFromMessageContent } from './applyMvuFromMessage';
import {
  buildOrderedDualSecondPrompt,
  formatAuxiliaryStatContext,
} from './buildDualSecondPrompt';
import {
  hasUpdateVariableBlock,
  logDualApiSkip,
  notifyDualApiError,
  notifyDualApiRateLimited,
  notifyDualApiRerollFail,
  notifyDualApiRerollSuccess,
  notifyDualApiSuccess,
  writeDualApiProof,
} from './dualApiProof';
import { isOpeningMessageFloor } from './openingFloor';
import { syncStatFromAssistantMessage } from './syncFromMaintext';

export const DUAL_MERGE_MARKER = '<!--th_dual_api_merged-->';

let busy = false;
/** 本会话内已跑过第二路的楼层，避免事件连发重复请求 */
const handledMessageIds = new Set<number>();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return msg.includes('too many requests') || msg.includes('429') || msg.includes('rate limit');
}

export function stripDualApiArtifacts(message: string): string {
  let m = message;
  const markerIdx = m.indexOf(DUAL_MERGE_MARKER);
  if (markerIdx !== -1) {
    m = m.slice(0, markerIdx);
  }
  m = m.replace(/<UpdateVariable[\s\S]*?<\/UpdateVariable>/gi, '');
  return m.trimEnd();
}

function getLatestAssistantFloor(): { message_id: number; message: string } | null {
  try {
    const latest = getChatMessages(-1)[0];
    if (!latest || latest.role !== 'assistant') {
      return null;
    }
    return { message_id: latest.message_id, message: latest.message ?? '' };
  } catch {
    return null;
  }
}

function resolveAssistantFloor(message_id?: number): { message_id: number; message: string } | null {
  if (message_id != null) {
    const row = getChatMessages(message_id)[0];
    if (!row || row.role !== 'assistant') {
      return null;
    }
    return { message_id, message: row.message ?? '' };
  }
  return getLatestAssistantFloor();
}

function getStatDataForFloor(message_id: number): unknown {
  try {
    return _.get(getVariables({ type: 'message', message_id }), 'stat_data');
  } catch {
    return undefined;
  }
}

async function generateRawWithRetries(args: {
  system: string;
  user: string;
  custom_api: { apiurl: string; key?: string; model?: string; source: 'openai' };
  maxRetries: number;
}): Promise<string> {
  const configuredMax = Math.min(10, Math.max(0, args.maxRetries));
  let lastErr: unknown;

  for (let attempt = 0; attempt <= configuredMax; attempt++) {
    try {
      const result = await generateRaw({
        user_input: '',
        should_silence: true,
        custom_api: args.custom_api,
        ordered_prompts: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.user },
        ],
      });
      if (typeof result === 'string') {
        return result;
      }
      const obj = result as { content?: string };
      return typeof obj.content === 'string' ? obj.content : '';
    } catch (e) {
      lastErr = e;
      const rateLimited = isRateLimitError(e);
      console.warn(`[多API串联] generateRaw 失败 (${attempt + 1})`, e);

      if (attempt >= configuredMax) {
        break;
      }
      if (rateLimited && attempt >= 1) {
        break;
      }

      const baseMs = rateLimited ? 5000 : 1800;
      const waitMs = baseMs * 2 ** attempt;
      console.info(`[多API串联] ${waitMs}ms 后重试…`);
      await sleep(waitMs);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

type RunOptions = {
  force?: boolean;
  reroll?: boolean;
  message_id?: number;
};

async function executeDualSecondPass(opts: RunOptions = {}): Promise<void> {
  if (busy) {
    if (opts.reroll) {
      notifyDualApiRerollFail('第二路正在处理中，请稍后再试');
    }
    return;
  }

  const ui = loadUiSettingsFromChat();
  if (ui.outputMode !== 'dual') {
    if (opts.reroll) {
      notifyDualApiRerollFail('请先在设置中启用「双 API」模式');
    }
    return;
  }

  const url = ui.dualApi.apiUrl.trim();
  if (!url) {
    if (opts.reroll) {
      notifyDualApiRerollFail('请先在设置中填写第二路 API URL');
    } else {
      logDualApiSkip('未配置第二路 API URL');
    }
    return;
  }

  const floor = resolveAssistantFloor(opts.message_id);
  if (!floor?.message) {
    if (opts.reroll) {
      notifyDualApiRerollFail('未找到可处理的 assistant 楼层');
    } else {
      logDualApiSkip('最后一楼不是 assistant');
    }
    return;
  }

  const targetMessageId = floor.message_id;
  if (isOpeningMessageFloor(targetMessageId)) {
    if (opts.reroll) {
      notifyDualApiRerollFail('第 0 楼为开场白，不支持变量重 roll');
    } else {
      logDualApiSkip('第 0 楼为开场白，不写地点/天气/季节', targetMessageId);
    }
    return;
  }

  let baseMessage = floor.message;
  if (opts.reroll || opts.force) {
    handledMessageIds.delete(targetMessageId);
    baseMessage = stripDualApiArtifacts(baseMessage);
    if (baseMessage !== floor.message) {
      await setChatMessages([{ message_id: targetMessageId, message: baseMessage }], {
        refresh: 'affected',
      });
    }
  } else if (!baseMessage || baseMessage.includes(DUAL_MERGE_MARKER)) {
    return;
  } else if (handledMessageIds.has(targetMessageId)) {
    logDualApiSkip('本楼层已处理过第二路', targetMessageId);
    return;
  }

  const mainInner = buildDualSecondMaintextContext(baseMessage);
  if (!mainInner.trim() && opts.reroll) {
    notifyDualApiRerollFail('该楼层没有可解析的 maintext，无法重 roll 变量');
    return;
  }

  busy = true;
  try {
    const wbName = await resolveBoundWorldbookName();
    if (!wbName) {
      if (opts.reroll) {
        notifyDualApiRerollFail('未找到绑定世界书');
      } else {
        logDualApiSkip('未找到绑定世界书', targetMessageId);
      }
      return;
    }

    const { system, user } = buildOrderedDualSecondPrompt({
      maintextInner: mainInner,
      worldbook: await getWorldbook(wbName),
      statDataJson: JSON.stringify(getStatDataForFloor(targetMessageId) ?? {}, null, 2),
      auxiliaryContext: formatAuxiliaryStatContext(getStatDataForFloor(targetMessageId)),
    });

    const secondText = await generateRawWithRetries({
      system,
      user,
      custom_api: {
        apiurl: url,
        key: ui.dualApi.apiKey || undefined,
        model: ui.dualApi.model.trim() || undefined,
        source: 'openai',
      },
      maxRetries: ui.dualApi.maxRetries,
    });

    if (getLastMessageId() !== targetMessageId) {
      if (opts.reroll) {
        notifyDualApiRerollFail('生成期间楼层已变化，请对最新回复重试');
      } else {
        logDualApiSkip('生成期间楼层已变', targetMessageId);
      }
      return;
    }

    const rawNow = getChatMessages(targetMessageId)[0]?.message ?? '';
    const rawBase = stripDualApiArtifacts(rawNow);
    const hasUv = hasUpdateVariableBlock(secondText);
    const merged = `${rawBase.trimEnd()}\n\n${secondText.trim()}\n\n${DUAL_MERGE_MARKER}\n`;

    await setChatMessages([{ message_id: targetMessageId, message: merged }], { refresh: 'affected' });

    handledMessageIds.add(targetMessageId);
    writeDualApiProof({ result: 'success', messageId: targetMessageId, hasUpdateVariable: hasUv });

    if (opts.reroll) {
      notifyDualApiRerollSuccess(targetMessageId, hasUv);
    } else {
      notifyDualApiSuccess(targetMessageId, hasUv);
    }

    await waitGlobalInitialized('Mvu');
    if (!(await applyMvuFromMessageContent(targetMessageId, merged))) {
      await syncStatFromAssistantMessage(targetMessageId);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const rateLimited = isRateLimitError(e);

    let fallbackOk = false;
    if (rateLimited) {
      handledMessageIds.add(targetMessageId);
      await waitGlobalInitialized('Mvu');
      fallbackOk = await syncStatFromAssistantMessage(targetMessageId);
    }

    writeDualApiProof({
      result: 'error',
      messageId: targetMessageId,
      reasonZh: rateLimited ? `限流${fallbackOk ? '，已正文兜底' : ''}` : msg,
    });

    if (opts.reroll) {
      notifyDualApiRerollFail(
        rateLimited
          ? fallbackOk
            ? '第二路限流，已尝试正文兜底写入地点/天气等'
            : '第二路 API 请求过快，请稍后再试'
          : msg,
      );
    } else if (rateLimited) {
      notifyDualApiRateLimited(fallbackOk);
    } else {
      notifyDualApiError(msg);
    }
    console.error('[多API串联] 第二路失败', e);
  } finally {
    busy = false;
  }
}

export async function runDualSecondPassIfNeeded(): Promise<void> {
  await executeDualSecondPass();
}

/** 叙事已出但变量未更新时，对指定或最新 assistant 楼重新跑第二路 */
export async function rerollDualSecondPass(message_id?: number): Promise<void> {
  await executeDualSecondPass({ force: true, reroll: true, message_id });
}
