/** MVU 编辑器里未填字段有时显示为 value */
export function isBlankField(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  const t = String(value).trim();
  return t === '' || t === 'value';
}

export function isPlaceholderUid(uid: unknown): boolean {
  if (isBlankField(uid)) {
    return true;
  }
  return /^X-00010086$/i.test(String(uid).trim());
}

export function resolvePlayerDisplayName(statName: unknown): string {
  const raw = typeof statName === 'string' ? statName.trim() : '';
  if (raw && !raw.includes('{{user}}')) {
    return raw;
  }
  try {
    const fromSt = SillyTavern.name1?.trim();
    if (fromSt) {
      return fromSt;
    }
  } catch {
    /* 非酒馆环境 */
  }
  return '幸存者';
}

let pinyinModule: { pinyin: (text: string, options?: Record<string, unknown>) => string | string[] } | null =
  null;

async function loadPinyin() {
  if (pinyinModule) {
    return pinyinModule;
  }
  pinyinModule = (await import(
    'https://testingcf.jsdelivr.net/npm/pinyin-pro@3.26.0/+esm'
  )) as typeof pinyinModule;
  return pinyinModule;
}

/** UID：姓名拼音首字母大写 + -00010086 */
export async function buildUidFromPlayerName(name: string): Promise<string> {
  const n = name.trim();
  const latinWords = n.match(/[A-Za-z]+/g);
  if (latinWords?.length) {
    const initials = latinWords.map(w => w[0]!.toUpperCase()).join('').slice(0, 3);
    if (initials.length >= 1) {
      return `${initials}-00010086`;
    }
  }
  try {
    const mod = await loadPinyin();
    const raw = mod?.pinyin(n, { pattern: 'first', toneType: 'none', type: 'array' });
    const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
    const letters = arr
      .map(s => String(s).trim()[0])
      .filter(Boolean)
      .map(c => c.toUpperCase())
      .join('')
      .slice(0, 3);
    if (letters.length >= 1) {
      return `${letters}-00010086`;
    }
  } catch (e) {
    console.warn('[多API串联] pinyin 不可用', e);
  }
  return 'X-00010086';
}
