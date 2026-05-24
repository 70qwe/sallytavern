import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActionOption } from './types';
import {
  loadFromLatestAssistantMessage,
  loadRecentStoryChatLines,
  type ParsedOption,
  type StoryChatLine,
} from './utils/messageParser';

function parsedOptionsToActions(opts: ParsedOption[]): ActionOption[] {
  const letters: ActionOption['type'][] = ['A', 'B', 'C', 'D'];
  return opts.slice(0, 4).map((o, i) => {
    const u = o.id.trim().toUpperCase();
    const type = (letters.includes(u as ActionOption['type'])
      ? u
      : letters[i] ?? 'A') as ActionOption['type'];
    return {
      id: `opt-${type}-${i}`,
      label: `选项 ${type}`,
      type,
      description: o.text,
    };
  });
}

/**
 * 监听聊天事件，解析最新 assistant 楼层的 &lt;maintext&gt; / &lt;option&gt;
 */
export function useAssistantStory() {
  const [maintext, setMaintext] = useState('');
  const [parsedOptions, setParsedOptions] = useState<ParsedOption[]>([]);
  const [sourceMessageId, setSourceMessageId] = useState<number | undefined>();
  const [latestPuppy, setLatestPuppy] = useState<StoryChatLine['puppy']>();
  const [storyLines, setStoryLines] = useState<StoryChatLine[]>([]);

  const refresh = useCallback(() => {
    const r = loadFromLatestAssistantMessage();
    setMaintext(r.maintext);
    setLatestPuppy(r.puppy ?? undefined);
    setParsedOptions(r.options);
    setSourceMessageId(r.messageId);
    setStoryLines(loadRecentStoryChatLines());
  }, []);

  useEffect(() => {
    refresh();
    const subs = [
      eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, refresh),
      eventOn(tavern_events.MESSAGE_UPDATED, refresh),
      eventOn(tavern_events.MESSAGE_RECEIVED, refresh),
      eventOn(tavern_events.CHAT_CHANGED, refresh),
      eventOn(tavern_events.GENERATION_ENDED, refresh),
      eventOn(tavern_events.MESSAGE_SENT, refresh),
    ];
    return () => subs.forEach(s => s.stop());
  }, [refresh]);

  const actionsFromParse = useMemo(
    () => parsedOptionsToActions(parsedOptions),
    [parsedOptions],
  );

  return { maintext, actionsFromParse, sourceMessageId, latestPuppy, storyLines, refresh };
}
