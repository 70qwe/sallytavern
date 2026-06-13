import type { Schema as StatData } from '../../schema';
import type {
    Dungeon,
    ForumPost, HuntingList, Inventory, LeaderboardEntry, PlayerInfo, PlayerTradeItem,
    PrivateMessage,
    Rating, SeasonInfo,
    ShopItem,
    WorldInfo
} from './types';
import { mapClothing } from './clothing';

const RATINGS: readonly Rating[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

function parseRating(s: string): Rating {
  return RATINGS.includes(s as Rating) ? (s as Rating) : 'E';
}

const 阶段到数字: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };

/** 各阶段默认能力详述（与 initvar 能力列表短名对应；变量里改名后浮窗仍以阶段槽位为准） */
const 梦魇欲魔阶段详述: Record<'一' | '二' | '三' | '四', string> = {
  一: '睡着时对目标植入梦境性暗示，削弱其现实中的直男防线。',
  二: '短暂控制目标的行为（如「不许动」），随着 sp 增加，可从简单的动作指令逐渐升级为深层认知篡改。',
  三: '让时间停止，初始仅能停止 10 秒，随着 sp 增加而适当延长，时停期间目标的快感会累积。',
  四: '最高阶能力，可永久改变目标的性取向认知或社会常识。',
};

export function statToWorldInfo(s: StatData): WorldInfo {
  const w = s.世界;
  return {
    date: w.日期,
    location: w.地点,
    weather: w.天气,
    survivalDays: w.生存天数,
    /** 侧栏「当前赛季」优先展示玩法赛季，自然季节见 seasonNatural（若后续需要可再拆字段） */
    season: w.当前赛季?.trim() || w.季节,
  };
}

export function statToPlayerInfo(s: StatData): PlayerInfo {
  const p = s.主角;
  const m = p.梦魇欲魔;
  const phaseKeys = ['一', '二', '三', '四'] as const;
  const currentPhaseNum = 阶段到数字[m.阶段] ?? 1;
  const abilities = phaseKeys
    .filter(key => (阶段到数字[key] ?? 0) <= currentPhaseNum)
    .map(key => {
      const label = m.能力列表[key]?.trim();
      if (!label) {
        return null;
      }
      return {
        name: label,
        description: `阶段 ${key}：${label}`,
        detail: 梦魇欲魔阶段详述[key],
        phaseKey: key,
      };
    })
    .filter(
      (x): x is { name: string; description: string; detail: string; phaseKey: '一' | '二' | '三' | '四' } =>
        x !== null,
    );

  return {
    uid: p.uid,
    name: p.姓名,
    race: p.种族,
    nickname: p.昵称,
    talent: m.名称,
    phase: 阶段到数字[m.阶段] ?? 1,
    abilities:
      abilities.length > 0
        ? abilities
        : [
            {
              name: m.名称,
              description: '梦魇欲魔之力随阶段解锁。',
              detail: '',
              phaseKey: '一',
            },
          ],
    sp: p.sp,
    pollution: p.污染值,
    fullness: p.饱食度,
    strength: { current: p.力量.当前 ?? null, max: p.力量.上限 },
    constitution: { current: p.体质.当前 ?? null, max: p.体质.上限 },
    agility: { current: p.敏捷.当前 ?? null, max: p.敏捷.上限 },
    rating: p.角色总评,
    ratingComment: p.角色总评评语,
    clothing: mapClothing(p.衣着),
  };
}

export function statToInventory(s: StatData): Inventory {
  const items = Object.entries(s.物品栏)
    .map(([id, i]) => {
      const name = (i.名称?.trim() || id).trim();
      const count = i.数量 ?? 0;
      if (!name || count <= 0) {
        return null;
      }
      return {
        id,
        name,
        description: i.描述 ?? '',
        count,
      };
    })
    .filter((it): it is NonNullable<typeof it> => it !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  return {
    currentWeight: s.背包.已用格子,
    maxWeight: s.背包.格子上限,
    items,
  };
}

export function statToHuntingList(s: StatData): HuntingList {
  const targets = Object.entries(s.狩猎名单.进行中)
    .map(([id, t]) => ({
      name: t.姓名,
      uid: t.uid || id,
      nickname: t.昵称,
      race: t.种族,
      identity: t.身份,
      age: t.年龄,
      semenQuality: t.精液质量,
      talent: t.天赋,
      strength: { current: t.力量.当前, max: t.力量.上限 },
      constitution: { current: t.体质.当前, max: t.体质.上限 },
      agility: { current: t.敏捷.当前, max: t.敏捷.上限 },
      corruption: t.沦陷度,
      location: t.当前位置,
      status: t.当前状态,
      estimatedSP: t.预计产出SP,
      clothing: mapClothing(t.衣着),
    }))
    .filter(t => t.name.trim() || t.uid || t.nickname.trim());

  const slaves = Object.entries(s.狩猎名单.已奴隶)
    .map(([id, t]) => ({
      name: t.姓名,
      uid: t.uid || id,
      nickname: t.昵称,
      race: t.种族,
      identity: t.身份,
      age: t.年龄,
      semenQuality: t.精液质量,
      talent: t.天赋,
      strength: { current: t.力量.当前, max: t.力量.上限 },
      constitution: { current: t.体质.当前, max: t.体质.上限 },
      agility: { current: t.敏捷.当前, max: t.敏捷.上限 },
      location: t.当前位置,
      status: t.当前状态或用途,
      purpose: t.当前状态或用途,
      estimatedSP: t.预计产出SP,
      clothing: mapClothing(t.衣着),
    }))
    .filter(s => s.name.trim() || s.uid || s.nickname.trim());

  return { targets, slaves };
}

function deriveForumTitle(content: string): string {
  const line = content
    .trim()
    .split(/\n/)[0]
    ?.replace(/\s+/g, ' ')
    .trim();
  if (!line) {
    return '无标题帖子';
  }
  return line.length > 36 ? `${line.slice(0, 36)}…` : line;
}

function formatForumAuthor(raw: string): { author: string; isAnonymous: boolean } {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '匿名' || /匿名/i.test(trimmed)) {
    return { author: '匿名', isAnonymous: true };
  }
  return { author: trimmed, isAnonymous: false };
}

export function statToForumPosts(s: StatData): ForumPost[] {
  return Object.entries(s.玩家论坛.帖子).map(([id, p]) => {
    const { author, isAnonymous } = formatForumAuthor(p.发帖人);
    const title = p.主题.trim() || deriveForumTitle(p.内容);
    return {
      id,
      title,
      content: p.内容,
      author,
      time: p.发帖时间,
      isAnonymous,
    };
  });
}

export function statToPrivateMessages(s: StatData): PrivateMessage[] {
  return Object.entries(s.玩家论坛.私信).map(([id, m]) => ({
    id,
    content: m.内容,
    sender: m.发送人,
    time: m.发送时间,
    isAnonymous: false,
  }));
}

export function statToShopItems(s: StatData): ShopItem[] {
  return Object.entries(s.交易行.系统商城).map(([id, m]) => ({
    id: `sys_${id}`,
    name: m.名称,
    price: m.价格,
    note: m.备注?.trim() || undefined,
  }));
}

export function statToPlayerTrades(s: StatData): PlayerTradeItem[] {
  return Object.entries(s.交易行.玩家交易).map(([id, m]) => ({
    id: `ply_${id}`,
    name: m.物品名称,
    seller: m.售卖人,
    time: m.上架时间,
    price: m.价格,
    isAnonymous: false,
  }));
}

export function statToSeasonInfo(s: StatData): SeasonInfo {
  return {
    name: s.世界.当前赛季 || s.世界.季节,
    duration: s.世界.赛季预计持续时间 || '—',
  };
}

export function statToDungeons(s: StatData): Dungeon[] {
  return Object.entries(s.副本列表).map(([id, d]) => ({
    id,
    name: d.副本名称,
    content: d.副本内容,
    difficulty: parseRating(d.副本难度),
    location: d.副本地点,
    reward: d.副本奖励,
  }));
}

export function statToLeaderboard(s: StatData): LeaderboardEntry[] {
  return Object.values(s.排行榜)
    .map(r => ({
      rank: r.排名,
      nickname: r.上榜人昵称,
      isAnonymous: false,
      score: r.排名,
    }))
    .sort((a, b) => a.rank - b.rank);
}

/** 预设 `<puppy>` 小剧场（与角色卡世界书无关） */
export interface PresetPuppyTheater {
  title: string;
  body: string;
}

export interface ChatLine {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  puppy?: PresetPuppyTheater;
}

export function statToChatLines(s: StatData): ChatLine[] {
  return s.界面对话.map((m, i) => ({
    id: `line-${i}`,
    role: m.角色 === 'ai' ? 'assistant' : 'user',
    content: m.文本,
  }));
}

export function statToGameUi(s: StatData) {
  return {
    world: statToWorldInfo(s),
    player: statToPlayerInfo(s),
    inventory: statToInventory(s),
    huntingList: statToHuntingList(s),
    forumPosts: statToForumPosts(s),
    privateMessages: statToPrivateMessages(s),
    shopItems: statToShopItems(s),
    playerTrades: statToPlayerTrades(s),
    seasonInfo: statToSeasonInfo(s),
    dungeons: statToDungeons(s),
    leaderboard: statToLeaderboard(s),
    chatLines: statToChatLines(s),
  };
}

export type GameUi = ReturnType<typeof statToGameUi>;
