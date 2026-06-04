/**
 * 消息解析：从 assistant 楼层正文提取 <maintext>、<option>、预设 <puppy> 等（排除 thinking 区内标签）
 */

import type { PresetPuppyTheater } from '../mvuMap';

export type { PresetPuppyTheater };

/**
 * 移除推理/thinking 相关块后再做标签解析
 *（导出供多 API 第二路：无 `<maintext>` 时仍可用可见正文作回退）
 */
export function stripThinkingBlocks(content: string): string {
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

/** 只提取不在 thinking 清洗范围之外的最后一个 <maintext> */
export function parseMaintext(messageContent: string): string {
  if (!messageContent) {
    return '';
  }

  const cleaned = stripThinkingBlocks(messageContent);
  const matches = cleaned.match(/<maintext\s*>([\s\S]*?)<\/maintext\s*>/gi);
  if (!matches?.length) {
    return '';
  }
  const lastMatch = matches[matches.length - 1];
  const content = lastMatch.match(/<maintext\s*>([\s\S]*?)<\/maintext\s*>/i);
  return content?.[1]?.trim() ?? '';
}

const DUAL_MAIN_FALLBACK_MAX = 200_000;

/**
 * 第二路 API 用的「本回合正文」片段：优先闭合的 `<maintext>`；否则用去 thinking / 占位后的可见正文；
 * 仍无内容时给固定说明，避免第二路因空正文被整段跳过。
 */
export function buildDualSecondMaintextContext(raw: string): string {
  const fromTags = parseMaintext(raw);
  if (fromTags) {
    return fromTags;
  }
  let s = stripThinkingBlocks(raw ?? '');
  s = s.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
  s = s.trim();
  if (s.length > 0) {
    return s.length > DUAL_MAIN_FALLBACK_MAX ? s.slice(0, DUAL_MAIN_FALLBACK_MAX) : s;
  }
  return '（本楼层未解析到闭合的 <maintext>，且无其它可见正文；请仅依据下方 stat_data 与世界书规则输出 JSON Patch，勿复述剧情。）';
}

/** 提取最后一个 &lt;sum&gt;…&lt;/sum&gt;（用于读档摘要） */
export function parseSum(messageContent: string): string {
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

export interface AssistantFloorSlice {
  messageId: number;
  maintext: string;
  sum: string;
}

export type StoryFormatBlock = 'maintext' | 'option' | 'sum';

export interface AssistantStoryFormatCheck {
  ok: boolean;
  missing: StoryFormatBlock[];
  optionCount: number;
}

/** 检测 assistant 楼层是否含完整 maintext / option(A～D) / sum */
export function checkAssistantStoryFormat(raw: string): AssistantStoryFormatCheck {
  const missing: StoryFormatBlock[] = [];
  const maintext = parseMaintext(raw);
  const options = parseOptions(raw);
  const sum = parseSum(raw);

  if (!maintext.trim()) {
    missing.push('maintext');
  }
  if (options.length < 4) {
    missing.push('option');
  }
  if (!sum.trim()) {
    missing.push('sum');
  }

  return { ok: missing.length === 0, missing, optionCount: options.length };
}

/** 枚举当前聊天中所有 assistant 楼层及其解析后的 maintext / sum */
export function listAssistantFloorsParsed(): AssistantFloorSlice[] {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      return [];
    }
    const assistants = getChatMessages(`0-${lastId}`, { role: 'assistant' });
    return assistants.map(m => {
      const raw = m.message ?? '';
      return {
        messageId: m.message_id,
        maintext: parseMaintext(raw),
        sum: parseSum(raw),
      };
    });
  } catch (e) {
    console.warn('[messageParser] listAssistantFloorsParsed:', e);
    return [];
  }
}

export interface ParsedOption {
  id: string;
  text: string;
}

const MAX_PLAYER_OPTIONS = 4;
const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;

/** 与世界书「选项A:」一致，并兼容 A. / A: 等写法 */
const OPTION_LINE_PREFIX = /^(?:选项\s*)?([A-Da-d])[.．:：、]\s*(.*)$/;

function isJunkOptionLine(line: string): boolean {
  const t = line.trim();
  if (!t) {
    return true;
  }
  if (/^<\/?[\w-]+[^>]*>?\s*$/i.test(t)) {
    return true;
  }
  if (/^<[\w-]+[\s/>]/i.test(t)) {
    return true;
  }
  if (/^##\s*[【\[]/.test(t)) {
    return true;
  }
  if (/^#{1,6}\s/.test(t) && /模块|填表|logicpass|Analysis|UpdateVariable/i.test(t)) {
    return true;
  }
  return false;
}

function normalizeOptionId(id: string): string | null {
  const u = id.trim().toUpperCase();
  return OPTION_IDS.includes(u as (typeof OPTION_IDS)[number]) ? u : null;
}

/** 去重并只保留 A～D，按字母序 */
function finalizeOptions(options: ParsedOption[]): ParsedOption[] {
  const byId = new Map<string, ParsedOption>();
  for (const o of options) {
    const id = normalizeOptionId(o.id);
    const text = o.text.trim();
    if (!id || !text || isJunkOptionLine(text)) {
      continue;
    }
    if (!byId.has(id)) {
      byId.set(id, { id, text });
    }
  }
  return OPTION_IDS.map(id => byId.get(id)).filter((o): o is ParsedOption => o != null);
}

function parseOptionBlockText(optionText: string): ParsedOption[] {
  const lines = optionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !isJunkOptionLine(line));

  const grouped: ParsedOption[] = [];
  let current: { id: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) {
      return;
    }
    const text = current.lines.join('\n').trim();
    if (text) {
      grouped.push({ id: current.id, text });
    }
    current = null;
  };

  for (const line of lines) {
    const prefixed = line.match(OPTION_LINE_PREFIX);
    if (prefixed) {
      flush();
      const id = normalizeOptionId(prefixed[1]);
      if (!id) {
        continue;
      }
      const rest = prefixed[2]?.trim() ?? '';
      current = { id, lines: rest ? [rest] : [] };
      continue;
    }

    const dotPrefix = line.match(/^([A-D])\.\s*(.*)$/i);
    if (dotPrefix) {
      flush();
      const id = normalizeOptionId(dotPrefix[1]);
      if (!id) {
        continue;
      }
      const rest = dotPrefix[2]?.trim() ?? '';
      current = { id, lines: rest ? [rest] : [] };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }
  flush();

  if (grouped.length > 0) {
    return finalizeOptions(grouped);
  }

  // 无 A～D 标记时：仅当 1～4 行短文本才当作选项，避免整段逻辑/任务说明被拆成几十个
  if (lines.length >= 1 && lines.length <= MAX_PLAYER_OPTIONS) {
    return finalizeOptions(
      lines.map((line, index) => ({
        id: OPTION_IDS[index] ?? 'A',
        text: line,
      })),
    );
  }

  return [];
}

/**
 * 解析 <option>：支持 id 属性或裸文本块（选项A: / A. / B. …，最多四条）
 */
export function parseOptions(messageContent: string): ParsedOption[] {
  if (!messageContent) {
    return [];
  }

  const cleaned = stripThinkingBlocks(messageContent);

  const withId: ParsedOption[] = [];
  const optionWithIdRegex = /<option\s+id="([^"]+)"\s*>([\s\S]*?)<\/option\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = optionWithIdRegex.exec(cleaned)) !== null) {
    const id = normalizeOptionId(match[1]);
    const text = match[2].trim();
    if (id && text && !isJunkOptionLine(text)) {
      withId.push({ id, text });
    }
  }
  if (withId.length > 0) {
    return finalizeOptions(withId);
  }

  const optionMatch = cleaned.match(/<option\s*>([\s\S]*?)<\/option\s*>/i);
  if (!optionMatch) {
    return [];
  }

  return parseOptionBlockText(optionMatch[1]);
}

/** 优先提取的叙事标签（世界书约定 maintext；部分模型会用 content 等） */
const NARRATIVE_WRAPPER_TAGS = ['maintext', 'content', 'story', 'narrative', '正文', '剧情'] as const;

/** 展示时整段移除的非叙事块（逻辑链、免责声明、变量、选项等；不含 puppy） */
const NON_NARRATIVE_BLOCK_TAGS = [
  'logicpass',
  'disclaimer',
  'count',
  'FictionalSandbox',
  'Protocol',
  'Analysis',
  'UpdateVariable',
  'option',
  'sum',
  'thinking',
  'redacted_thinking',
  'redacted_reasoning',
  'reasoning',
] as const;

/** 主叙事外、单独展示的预设附加块 */
const PRESET_EXTRA_DISPLAY_TAGS = ['puppy'] as const;

export interface AssistantStoryDisplay {
  main: string;
  puppy: PresetPuppyTheater | null;
}

function extractLastTagInner(raw: string, tagName: string): string {
  const re = new RegExp(`<${tagName}\\s*>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'gi');
  const matches = [...raw.matchAll(re)];
  if (!matches.length) {
    return '';
  }
  return matches[matches.length - 1][1]?.trim() ?? '';
}

function removeTagBlocks(raw: string, tagNames: readonly string[]): string {
  let s = raw;
  for (const tag of tagNames) {
    const re = new RegExp(`<${tag}\\s*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
    s = s.replace(re, '');
  }
  return s;
}

/**
 * 预设小剧场：`<puppy><details><summary>标题</summary>正文</details></puppy>`
 * 正文只取第一个 `<details>` 内、`</summary>` 之后到 `</details>` 之前；不含 maintext 等叙事块。
 */
export function parsePuppyTheater(messageContent: string): PresetPuppyTheater | null {
  const puppyInner = extractLastTagInner(stripThinkingBlocks(messageContent), 'puppy');
  if (!puppyInner) {
    return null;
  }

  const summaryMatch = puppyInner.match(/<summary\s*>([\s\S]*?)<\/summary\s*>/i);
  const title = (summaryMatch?.[1] ?? '小剧场').trim() || '小剧场';

  let body = '';
  const detailsMatch = puppyInner.match(/<details\s*>([\s\S]*?)<\/details\s*>/i);
  if (detailsMatch) {
    body = (detailsMatch[1] ?? '').replace(/<summary\s*>[\s\S]*?<\/summary\s*>/gi, '');
  } else if (summaryMatch) {
    const start = (summaryMatch.index ?? 0) + summaryMatch[0].length;
    body = puppyInner.slice(start).split(/<\/puppy>|<maintext\s*>|<option\s*>/i)[0] ?? '';
  }

  body = removeTagBlocks(body, [...NARRATIVE_WRAPPER_TAGS, ...NON_NARRATIVE_BLOCK_TAGS]);
  body = normalizeStoryWhitespace(stripRemainingAngleTags(body));

  if (!body) {
    return null;
  }

  return { title, body };
}

function extractFirstNarrativeWrapper(raw: string): string {
  const cleaned = stripThinkingBlocks(raw);
  for (const tag of NARRATIVE_WRAPPER_TAGS) {
    const re = new RegExp(`<${tag}\\s*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'gi');
    const matches = [...cleaned.matchAll(re)];
    if (matches.length > 0) {
      const body = matches[matches.length - 1][1]?.trim() ?? '';
      if (body) {
        return body;
      }
    }
  }
  return '';
}

function stripNonNarrativeBlocks(raw: string): string {
  let s = raw;
  for (const tag of NON_NARRATIVE_BLOCK_TAGS) {
    const re = new RegExp(`<${tag}\\s*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
    s = s.replace(re, '');
  }
  s = s.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
  s = s.replace(/<!--th_dual_api_merged-->/gi, '');
  return s;
}

/** 将模型常输出的 markdown 分隔符转为段落换行 */
function softenMarkdownDividers(text: string): string {
  return text
    .replace(/\s*---+\s*/g, '\n\n')
    .replace(/\s*(#{1,6}\s+)/g, '\n\n$1');
}

/** 保留段落换行，仅压缩行内多余空白 */
function normalizeStoryWhitespace(text: string): string {
  return softenMarkdownDividers(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t\f\v]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripRemainingAngleTags(text: string): string {
  return text.replace(/<[^>]+>/g, '');
}

/**
 * 界面展示：主叙事（黑名单剔除变量/选项等）+ 预设 puppy 小剧场（若有）
 * 第二路变量仍只用 main，不包含 puppy。
 */
export function parseAssistantStoryDisplay(messageContent: string): AssistantStoryDisplay {
  if (!messageContent?.trim()) {
    return { main: '', puppy: null };
  }

  const cleaned = stripThinkingBlocks(messageContent);
  const puppy = parsePuppyTheater(cleaned);

  // 先从全文取 <maintext>（即使写在 <puppy> 内也能命中）；再回退到去 puppy 后的正文
  const fromMaintextTag = parseMaintext(cleaned);
  const withoutExtras = removeTagBlocks(cleaned, [...PRESET_EXTRA_DISPLAY_TAGS, ...NON_NARRATIVE_BLOCK_TAGS]);

  let main = '';
  if (fromMaintextTag) {
    main = normalizeStoryWhitespace(stripRemainingAngleTags(fromMaintextTag));
  } else {
    const fromWrapper = extractFirstNarrativeWrapper(withoutExtras);
    if (fromWrapper) {
      main = normalizeStoryWhitespace(stripRemainingAngleTags(fromWrapper));
    } else {
      let s = withoutExtras;
      s = s.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
      s = s.replace(/<!--th_dual_api_merged-->/gi, '');
      s = stripRemainingAngleTags(s);
      main = normalizeStoryWhitespace(s);
    }
  }

  return { main, puppy };
}

/** 界面展示用：仅主叙事正文（兼容旧调用） */
export function parseStoryDisplayText(messageContent: string): string {
  return parseAssistantStoryDisplay(messageContent).main;
}

export interface LoadFromAssistantResult {
  maintext: string;
  puppy: PresetPuppyTheater | null;
  options: ParsedOption[];
  messageId?: number;
  raw?: string;
}

export interface StoryChatLine {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  puppy?: PresetPuppyTheater;
}

/** 剧情区：仅最新一条 assistant 的主叙事（不含用户楼） */
export function loadRecentStoryChatLines(): StoryChatLine[] {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      return [];
    }
    const assistants = getChatMessages(`0-${lastId}`, { role: 'assistant', hide_state: 'all' });
    if (!assistants.length) {
      return [];
    }
    const latest = assistants[assistants.length - 1];
    const line = rowToStoryLine(latest);
    return line ? [line] : [];
  } catch (e) {
    console.warn('[messageParser] loadRecentStoryChatLines:', e);
    return [];
  }
}

function assistantRowFallbackDisplayText(raw: string): string {
  let s = stripThinkingBlocks(raw);
  s = s.replace(/<StatusPlaceHolderImpl\s*\/?>/gi, '');
  s = removeTagBlocks(s, [...PRESET_EXTRA_DISPLAY_TAGS, ...NON_NARRATIVE_BLOCK_TAGS]);
  s = stripRemainingAngleTags(s);
  return normalizeStoryWhitespace(s);
}

function rowToStoryLine(row: { message_id: number; role: string; message?: string }): StoryChatLine | null {
  const raw = row.message ?? '';
  if (row.role === 'user') {
    const content = raw.trim();
    return content ? { id: `user-${row.message_id}`, role: 'user', content } : null;
  }
  if (row.role !== 'assistant') {
    return null;
  }
  const { main, puppy } = parseAssistantStoryDisplay(raw);
  let content = main || parseStoryDisplayText(raw);
  if (!content) {
    content = assistantRowFallbackDisplayText(raw);
  }
  if (!content && !puppy) {
    return null;
  }
  return {
    id: `assistant-${row.message_id}`,
    role: 'assistant',
    content,
    puppy: puppy ?? undefined,
  };
}

/**
 * 取当前聊天中「最后一条 assistant 楼层」的正文并解析标签
 */
export function loadFromLatestAssistantMessage(): LoadFromAssistantResult {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      return { maintext: '', options: [] };
    }

    const assistants = getChatMessages(`0-${lastId}`, { role: 'assistant' });
    if (!assistants.length) {
      return { maintext: '', options: [] };
    }

    const latest = assistants[assistants.length - 1];
    const messageContent = latest.message ?? '';
    const display = parseAssistantStoryDisplay(messageContent);

    return {
      maintext: display.main,
      puppy: display.puppy,
      options: parseOptions(messageContent),
      messageId: latest.message_id,
      raw: messageContent,
    };
  } catch (e) {
    console.warn('[messageParser] loadFromLatestAssistantMessage:', e);
    return { maintext: '', puppy: null, options: [] };
  }
}
