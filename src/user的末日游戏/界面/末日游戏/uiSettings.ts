import { klona } from 'klona';
import { z } from 'zod';

/** 聊天变量中存储 UI 设置的键 */
export const CHAT_UI_SETTINGS_KEY = '末日游戏_ui';

/** 角色卡变量：跨聊天会话记住副 API（URL / Key / 模型 / 重试） */
export const CHARACTER_DUAL_API_KEY = '末日游戏_dualApi';

const DualApiSchema = z.object({
  apiUrl: z.string().default(''),
  apiKey: z.string().default(''),
  model: z.string().default(''),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

export const UiSettingsSchema = z.object({
  outputMode: z.enum(['single', 'dual']).default('dual'),
  /** 根字号 px */
  fontSizePx: z.number().min(12).max(28).default(15),
  /** 界面字体族预设 */
  fontPreset: z.enum(['sans', 'serif', 'game', 'hand']).default('sans'),
  dualApi: DualApiSchema.default({}),
});

export type UiSettings = z.infer<typeof UiSettingsSchema>;
export type DualApiSettings = z.infer<typeof DualApiSchema>;

function loadDualApiFromCharacter(): DualApiSettings {
  try {
    const ch = getVariables({ type: 'character' });
    const raw = _.get(ch, CHARACTER_DUAL_API_KEY);
    return DualApiSchema.parse(raw ?? {});
  } catch {
    return DualApiSchema.parse({});
  }
}

/** 新聊天无副 API 填写时沿用角色卡记忆；某字段在聊天里非空则优先聊天（同一会话内改过） */
function mergeDualApiFromSources(charDual: DualApiSettings, chatDual: DualApiSettings): DualApiSettings {
  const pickStr = (fromChar: string, fromChat: string) => (fromChat.trim() !== '' ? fromChat : fromChar);
  const chatStringsBlank = !chatDual.apiUrl.trim() && !chatDual.apiKey.trim() && !chatDual.model.trim();
  return DualApiSchema.parse({
    apiUrl: pickStr(charDual.apiUrl, chatDual.apiUrl),
    apiKey: pickStr(charDual.apiKey, chatDual.apiKey),
    model: pickStr(charDual.model, chatDual.model),
    maxRetries: chatStringsBlank ? charDual.maxRetries : chatDual.maxRetries,
  });
}

function saveDualApiToCharacter(dual: DualApiSettings): void {
  const ch = klona(getVariables({ type: 'character' }));
  _.set(ch, CHARACTER_DUAL_API_KEY, DualApiSchema.parse(dual));
  replaceVariables(ch, { type: 'character' });
}

export function loadUiSettingsFromChat(): UiSettings {
  const charDual = loadDualApiFromCharacter();
  try {
    const chat = getVariables({ type: 'chat' });
    const raw = _.get(chat, CHAT_UI_SETTINGS_KEY);
    const parsed = UiSettingsSchema.parse(raw ?? {});
    const chatDual = DualApiSchema.parse({ ...parsed.dualApi });
    return UiSettingsSchema.parse({
      ...parsed,
      dualApi: mergeDualApiFromSources(charDual, chatDual),
    });
  } catch {
    const base = UiSettingsSchema.parse({});
    return UiSettingsSchema.parse({
      ...base,
      dualApi: mergeDualApiFromSources(charDual, DualApiSchema.parse({})),
    });
  }
}

export function saveUiSettingsToChat(settings: UiSettings): void {
  const parsed = UiSettingsSchema.parse(settings);
  const chat = klona(getVariables({ type: 'chat' }));
  _.set(chat, CHAT_UI_SETTINGS_KEY, parsed);
  replaceVariables(chat, { type: 'chat' });
  saveDualApiToCharacter(parsed.dualApi);
}

/** 界面统一为「标题 + 正文」两套字体；忽略旧版 fontPreset，避免回退宋体 */
export function fontPresetToFamily(_preset: UiSettings['fontPreset']): string {
  return 'var(--font-body)';
}
