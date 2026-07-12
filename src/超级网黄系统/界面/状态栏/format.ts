const PLACEHOLDER = '（留空）';

/** 判断原始值是否为空（不套用占位文案） */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return String(value).trim() === '';
}

/** 文本类可变信息为空时, 统一显示「（留空）」占位 */
export function blank(value: unknown): string {
  return isEmpty(value) ? PLACEHOLDER : String(value).trim();
}

/** 为空时显示自定义占位文案，否则显示实际值 */
export function blankOr(value: unknown, fallback: string): string {
  return isEmpty(value) ? fallback : String(value).trim();
}

/** 判断某个值是否处于「留空」状态, 供样式区分占位文本使用 */
export function isBlank(value: unknown): boolean {
  return blank(value) === PLACEHOLDER;
}

/** 数字类信息格式化为带千分位的字符串 */
export function num(value: unknown): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString('zh-CN') : '0';
}
