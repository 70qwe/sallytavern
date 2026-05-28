import { klona } from 'klona';
import { useCallback, useEffect, useState } from 'react';
import { Schema, type Schema as StatData } from '../../schema';
import { TH_DUAL_API_NOTIFY } from '../../dualApiEvents';
import { normalizeStatDataBeforeParse } from './utils/statNormalize';

/** 侧边栏展示「当前进度」变量，跟最新楼层而非 iframe 挂载楼（常为第 0 楼开场白） */
const LATEST_MESSAGE_OPTION: VariableOption = { type: 'message', message_id: 'latest' };

function readLatestStatData(): StatData {
  const raw = _.get(getVariables(LATEST_MESSAGE_OPTION), 'stat_data', {});
  return Schema.parse(normalizeStatDataBeforeParse(raw));
}

export function useMessageMvuData() {
  const [data, setData] = useState<StatData>(() => readLatestStatData());

  const syncFromLatest = useCallback(() => {
    try {
      const next = readLatestStatData();
      setData(prev => (_.isEqual(prev, next) ? prev : next));
    } catch (e) {
      console.warn('[useMessageMvuData] 同步最新楼层变量失败', e);
    }
  }, []);

  useEffect(() => {
    syncFromLatest();

    const subs = [
      eventOn(tavern_events.GENERATION_ENDED, syncFromLatest),
      eventOn(tavern_events.MESSAGE_UPDATED, syncFromLatest),
      eventOn(tavern_events.MESSAGE_RECEIVED, syncFromLatest),
      eventOn(tavern_events.CHAT_CHANGED, syncFromLatest),
      eventOn(TH_DUAL_API_NOTIFY, syncFromLatest),
    ];

    const timer = setInterval(syncFromLatest, 2000);

    return () => {
      subs.forEach(s => s.stop());
      clearInterval(timer);
    };
  }, [syncFromLatest]);

  const replaceStat = useCallback((recipe: StatData | ((prev: StatData) => StatData)) => {
    setData(prev => {
      const next = Schema.parse(
        normalizeStatDataBeforeParse(typeof recipe === 'function' ? recipe(prev) : recipe),
      );
      updateVariablesWith(v => _.set(v, 'stat_data', klona(next)), LATEST_MESSAGE_OPTION);
      return next;
    });
  }, []);

  return { data, replaceStat };
}
