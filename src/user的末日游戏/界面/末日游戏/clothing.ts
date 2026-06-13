/** 与 schema 中 衣着 九槽一致 */
export const CLOTHING_SLOTS = [
  '上衣',
  '下装',
  '外套',
  '帽子',
  '内衣裤',
  '袜子',
  '鞋子',
  '饰品',
  '手持物',
] as const;

export type ClothingSlot = (typeof CLOTHING_SLOTS)[number];

export type Clothing = Record<ClothingSlot, string>;

export function emptyClothing(): Clothing {
  return {
    上衣: '',
    下装: '',
    外套: '',
    帽子: '',
    内衣裤: '',
    袜子: '',
    鞋子: '',
    饰品: '',
    手持物: '',
  };
}

export function mapClothing(raw: Partial<Record<ClothingSlot, string>> | undefined | null): Clothing {
  const base = emptyClothing();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  for (const slot of CLOTHING_SLOTS) {
    const v = raw[slot];
    if (typeof v === 'string') {
      base[slot] = v;
    }
  }
  return base;
}

export function clothingHasAny(c: Clothing): boolean {
  return CLOTHING_SLOTS.some(slot => c[slot].trim().length > 0);
}
