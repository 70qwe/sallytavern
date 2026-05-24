import { isOpeningMessageFloor } from './openingFloor';

/**
 * 合并第二路正文后，主动让 MVU 解析楼层内的 &lt;UpdateVariable&gt;（仅 setChatMessages 不一定会触发解析）。
 */
export async function applyMvuFromMessageContent(
  message_id: number,
  messageContent: string,
): Promise<boolean> {
  if (isOpeningMessageFloor(message_id)) {
    return false;
  }

  if (!/<UpdateVariable\s*>/i.test(messageContent)) {
    return false;
  }

  await waitGlobalInitialized('Mvu');
  const opt: VariableOption = { type: 'message', message_id };
  const oldData = Mvu.getMvuData(opt);
  const parsed = await Mvu.parseMessage(messageContent, oldData);
  if (!parsed) {
    console.warn('[多API串联] parseMessage 未应用任何变量变更（检查 JSONPatch 路径与格式）', message_id);
    return false;
  }
  await Mvu.replaceMvuData(parsed, opt);
  console.info('[多API串联] 已从楼层正文解析 UpdateVariable → stat_data', message_id);
  return true;
}
