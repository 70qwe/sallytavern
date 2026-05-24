import { klona } from 'klona';
import { TH_DUAL_API_NOTIFY, type DualApiNotifyPayload } from '../../dualApiEvents';

/** 可选：在聊天变量里查看最近一次第二路结果 */
export const CHAT_DUAL_API_PROOF_KEY = '末日游戏_dualApiProof';

export interface DualApiProof {
  result: 'success' | 'skipped' | 'error';
  at: string;
  messageId?: number;
  reasonZh?: string;
  hasUpdateVariable?: boolean;
}

export function writeDualApiProof(
  proof: Omit<DualApiProof, 'at'> & { at?: string },
): DualApiProof {
  const full: DualApiProof = { at: proof.at ?? new Date().toISOString(), ...proof };
  try {
    const chat = klona(getVariables({ type: 'chat' }));
    _.set(chat, CHAT_DUAL_API_PROOF_KEY, full);
    replaceVariables(chat, { type: 'chat' });
  } catch {
    /* 忽略 */
  }
  return full;
}

export function logDualApiSkip(reasonZh: string, messageId?: number): void {
  console.info('[多API串联] 跳过', reasonZh, messageId ?? '');
}

async function emitDualApiNotify(payload: DualApiNotifyPayload): Promise<void> {
  try {
    await eventEmit(TH_DUAL_API_NOTIFY, payload);
  } catch {
    console.info('[多API串联]', payload);
  }
}

export function notifyDualApiSuccess(messageId: number, hasUpdateVariable: boolean): void {
  void emitDualApiNotify({ kind: 'second_pass_ok', messageId, hasUpdateVariable });
}

export function notifyDualApiRerollSuccess(messageId: number, hasUpdateVariable: boolean): void {
  void emitDualApiNotify({ kind: 'reroll_ok', messageId, hasUpdateVariable });
}

export function notifyDualApiRerollFail(message: string): void {
  void emitDualApiNotify({ kind: 'reroll_fail', message });
}

export function notifyDualApiError(message: string): void {
  toastr.error(message, '第二路 API', { timeOut: 8000 });
}

export function notifyDualApiRateLimited(fallbackOk: boolean): void {
  if (fallbackOk) {
    toastr.warning('第二路 API 请求过快，已用正文兜底写入地点/天气等', '第二路 API', { timeOut: 6000 });
    return;
  }
  toastr.warning('第二路 API 请求过快，请稍后再试或检查 API 配额', '第二路 API', { timeOut: 8000 });
}

export function hasUpdateVariableBlock(text: string): boolean {
  return /<UpdateVariable\s*>/i.test(text);
}
