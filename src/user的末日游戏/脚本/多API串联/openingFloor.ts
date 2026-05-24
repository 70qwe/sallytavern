/** 第 0 楼为角色开场白，不应用第二路变量与正文兜底（场景由第 1 楼起再定）。 */
export function isOpeningMessageFloor(message_id: number): boolean {
  return message_id === 0;
}
