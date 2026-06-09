/** 系统商城每日货架：仅基础生存物资（口粮/净水/医疗/保暖/照明/清洁/简易工具等） */

export type ShopShelfItem = {
  名称: string;
  价格: number;
  备注: string;
};

/** 可轮换的基础生存物资池（禁止武器弹药、奢侈品、狩猎/副本专属道具） */
export const BASIC_SURVIVAL_SHOP_POOL: ReadonlyArray<{ 名称: string; 价格: number }> = [
  { 名称: '压缩口粮（单份）', 价格: 25 },
  { 名称: '小型净水片（5 次）', 价格: 40 },
  { 名称: '医疗绷带包', 价格: 55 },
  { 名称: '阻燃胶带卷', 价格: 18 },
  { 名称: '手电筒（旧款 LED）', 价格: 35 },
  { 名称: '防疫口罩（3 只装）', 价格: 22 },
  { 名称: '蓄电池（小型）', 价格: 48 },
  { 名称: '多功能工具钳', 价格: 72 },
  { 名称: '驱虫喷雾', 价格: 30 },
  { 名称: '塑料储水袋（10L）', 价格: 42 },
  { 名称: '罐装豆泥（400g）', 价格: 28 },
  { 名称: '即食能量棒（3 根）', 价格: 32 },
  { 名称: '碘伏棉片（10 片）', 价格: 26 },
  { 名称: '创可贴混装包', 价格: 20 },
  { 名称: '保温应急毯', 价格: 38 },
  { 名称: '一次性雨披', 价格: 15 },
  { 名称: '保暖贴（5 片）', 价格: 24 },
  { 名称: '肥皂（旅行装）', 价格: 16 },
  { 名称: '折叠铝锅', 价格: 45 },
  { 名称: '打火石套装', 价格: 34 },
  { 名称: '活性炭净水芯', 价格: 52 },
  { 名称: '垃圾袋（加厚 10 只）', 价格: 14 },
  { 名称: '便携滤口罩（5 只）', 价格: 36 },
  { 名称: '维生素片（7 日量）', 价格: 44 },
  { 名称: '应急蜡烛（4 支）', 价格: 19 },
  { 名称: '尼龙绳（10m）', 价格: 21 },
  { 名称: '速溶汤块（6 块）', 价格: 23 },
  { 名称: '酒精消毒棉（20 片）', 价格: 27 },
  { 名称: '保温水壶（1L）', 价格: 58 },
  { 名称: '简易睡袋内胆', 价格: 65 },
];

const SHELF_COUNT = 10;

/** 由生存天数决定的可复现伪随机（同一天全服一致，跨日必换一批） */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleBySeed<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items];
  const rnd = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 生成第 survivalDay 天的系统商城十项货架 */
export function rollSystemShop(survivalDay: number): Record<string, ShopShelfItem> {
  const day = Math.max(1, Math.floor(survivalDay));
  const picked = shuffleBySeed(BASIC_SURVIVAL_SHOP_POOL, day * 9973 + 104729).slice(0, SHELF_COUNT);
  const out: Record<string, ShopShelfItem> = {};
  picked.forEach((item, i) => {
    const id = `sys_${String(i + 1).padStart(2, '0')}`;
    out[id] = {
      名称: item.名称,
      价格: item.价格,
      备注: `第 ${day} 天货架 ${i + 1}/${SHELF_COUNT}`,
    };
  });
  return out;
}
