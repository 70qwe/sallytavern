export type Rating = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface WorldInfo {
  date: string;
  location: string;
  weather: string;
  survivalDays: number;
  season: string;
}

export type NightmarePhaseKey = '一' | '二' | '三' | '四';

export interface Ability {
  name: string;
  description: string;
  /** 梦魇欲魔各阶段能力详述（浮窗 / title） */
  detail: string;
  phaseKey: NightmarePhaseKey;
}

export interface PlayerInfo {
  uid: string;
  name: string;
  race: string;
  nickname: string;
  talent: string;
  phase: number;
  abilities: Ability[];
  sp: number;
  pollution: number;
  fullness: number;
  strength: { current: number; max: number };
  constitution: { current: number; max: number };
  agility: { current: number; max: number };
  rating: Rating;
  ratingComment: string;
}

export interface Quest {
  id: string;
  name: string;
  reward: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface Inventory {
  currentWeight: number;
  maxWeight: number;
  items: Item[];
}

export interface TargetStats {
  name: string;
  uid: string;
  nickname: string;
  race: string;
  identity: string;
  age: number;
  semenQuality: Rating;
  talent: string;
  strength: { current: number; max: number };
  constitution: { current: number; max: number };
  agility: { current: number; max: number };
  corruption: number;
  location: string;
  status: string;
  estimatedSP: number;
}

export interface SlaveStats extends Omit<TargetStats, 'corruption' | 'estimatedSP'> {
  purpose: string;
  estimatedSP: number;
}

export interface HuntingList {
  targets: TargetStats[];
  slaves: SlaveStats[];
}

export interface ActionOption {
  id: string;
  label: string;
  type: 'A' | 'B' | 'C' | 'D';
  description: string;
}

export interface ForumPost {
  id: string;
  /** 列表与详情页标题 */
  title: string;
  content: string;
  author: string;
  time: string;
  isAnonymous: boolean;
}

export interface PrivateMessage {
  id: string;
  content: string;
  sender: string;
  time: string;
  isAnonymous: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  note?: string;
}

export interface PlayerTradeItem {
  id: string;
  name: string;
  seller: string;
  time: string;
  price: number;
  isAnonymous: boolean;
}

export interface SeasonInfo {
  name: string;
  duration: string;
}

export interface Dungeon {
  id: string;
  name: string;
  content: string;
  difficulty: Rating;
  location: string;
  reward: string;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  isAnonymous: boolean;
  score?: number;
}
