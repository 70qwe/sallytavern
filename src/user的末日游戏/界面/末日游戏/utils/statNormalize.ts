/** 将 MVU 可能写入的数组 / 松散对象规整为 record，便于 zod 与界面展示 */

function asObject(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function recordFromLoose(raw: unknown): Record<string, unknown> {
  const obj = asObject(raw);
  if (obj) {
    return obj;
  }
  if (!Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  raw.forEach((entry, index) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const e = entry as Record<string, unknown>;
      const key =
        (typeof e.id === 'string' && e.id) ||
        (typeof e.uid === 'string' && e.uid) ||
        (typeof e.名称 === 'string' && e.名称) ||
        `_${index}`;
      out[key] = entry;
      return;
    }
    if (typeof entry === 'string' && entry.trim()) {
      out[entry.trim()] = { 名称: entry.trim(), 数量: 1 };
    }
  });
  return out;
}

function normalizeItemEntry(key: string, raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { 名称: name, 数量: 1, 描述: '', 最大堆叠: 99, 稀有度: 'D' } : null;
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const name = String(o.名称 ?? o.name ?? key).trim();
  if (!name) {
    return null;
  }
  const count = Number(o.数量 ?? o.count ?? 1);
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  return {
    ...o,
    名称: name,
    数量: count,
    描述: String(o.描述 ?? o.description ?? ''),
    最大堆叠: Number(o.最大堆叠 ?? o.maxStack ?? 99) || 99,
    稀有度: o.稀有度 ?? o.rarity ?? 'D',
  };
}

/** 合并 物品栏 与误写在 背包 内的物品 */
export function normalize物品栏Field(statData: Record<string, unknown>): Record<string, unknown> {
  const bag = asObject(statData.背包);
  const fromBag = bag ? recordFromLoose(bag.物品栏) : {};
  const fromRoot = recordFromLoose(statData.物品栏);
  const merged = { ...fromBag, ...fromRoot };

  const items: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(merged)) {
    const entry = normalizeItemEntry(key, value);
    if (entry) {
      items[key] = entry;
    }
  }
  return items;
}

function normalizeHuntEntry(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const name = String(o.姓名 ?? o.name ?? '').trim();
  const uid = String(o.uid ?? o.UID ?? '').trim();
  const nickname = String(o.昵称 ?? o.nickname ?? '').trim();
  if (!name && !uid && !nickname) {
    return null;
  }
  return o;
}

export function normalize狩猎名单Field(statData: Record<string, unknown>): {
  进行中: Record<string, unknown>;
  已奴隶: Record<string, unknown>;
} {
  const raw = statData.狩猎名单;
  const root = asObject(raw);
  const 进行中 = recordFromLoose(root?.进行中);
  const 已奴隶 = recordFromLoose(root?.已奴隶);

  const active: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(进行中)) {
    const entry = normalizeHuntEntry(value);
    if (entry) {
      active[key] = entry;
    }
  }

  const slaves: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(已奴隶)) {
    const entry = normalizeHuntEntry(value);
    if (entry) {
      slaves[key] = entry;
    }
  }

  return { 进行中: active, 已奴隶: slaves };
}

/** 在 Schema.parse 前规整 stat_data，避免 AI 写入数组等形态导致整表解析失败 */
export function normalizeStatDataBeforeParse(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }
  const stat = { ...(raw as Record<string, unknown>) };
  stat.物品栏 = normalize物品栏Field(stat);
  stat.狩猎名单 = normalize狩猎名单Field(stat);
  return stat;
}
