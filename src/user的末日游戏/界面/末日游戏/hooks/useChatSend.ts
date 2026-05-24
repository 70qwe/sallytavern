import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 与酒馆主输入框一致：先写入用户楼层，再 /trigger 触发主 API 生成。
 * 注意：单独 `generate()` 不会在聊天记录里新增楼层，界面会看起来一直停在开场白。
 */
export async function appendUserChatMessage(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  await createChatMessages([{ role: 'user', message: trimmed }], { refresh: 'affected' });
}

export async function triggerMainReply(): Promise<void> {
  await triggerSlash('/trigger await=true');
}

/** @deprecated 请用 appendUserChatMessage + triggerMainReply，以便中间刷新界面 */
export async function sendChatMessage(text: string): Promise<void> {
  await appendUserChatMessage(text);
  await triggerMainReply();
}

/**
 * 仅跟踪「本输入框发起的 generate()」。
 * 不监听 GENERATION_STARTED：第二路 generateRaw、酒馆其它生成会误触发且常收不到 ENDED。
 */
export function useChatSend(options?: { onAfterSend?: () => void }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const composingRef = useRef(false);

  useEffect(() => {
    setSending(false);
    const sub = eventOn(tavern_events.CHAT_CHANGED, () => {
      setSending(false);
      setDraft('');
    });
    return () => sub.stop();
  }, []);

  const send = useCallback(
    async (text?: string) => {
      const payload = (text ?? draft).trim();
      if (!payload || sending) {
        return;
      }

      setSending(true);
      if (text === undefined) {
        setDraft('');
      }
      try {
        await appendUserChatMessage(payload);
        options?.onAfterSend?.();
        await triggerMainReply();
        options?.onAfterSend?.();
      } catch (e) {
        console.error('[末日游戏] 发送消息失败', e);
        toastr.error(e instanceof Error ? e.message : '发送失败', '发送消息');
      } finally {
        setSending(false);
      }
    },
    [draft, sending, options?.onAfterSend],
  );

  return {
    draft,
    setDraft,
    /** 仅本输入框 send() 进行中；与第二路 API、酒馆主栏生成无关 */
    sending,
    send,
    composingRef,
  };
}
