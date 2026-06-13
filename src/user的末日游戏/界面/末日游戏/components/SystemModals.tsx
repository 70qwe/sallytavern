import {
  Backpack,
  CalendarDays,
  Castle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Store,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { ForumPost } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import type { GameUi } from '../mvuMap';
import { ClothingPanel } from './ClothingPanel';

export type ModalId =
  | 'inventory'
  | 'hunting'
  | 'forum'
  | 'trade'
  | 'dungeons'
  | 'leaderboard'
  | 'season';

interface SystemModalsProps {
  active: ModalId | null;
  onClose: () => void;
  ui: GameUi;
}

export const SystemModals: React.FC<SystemModalsProps> = ({ active, onClose, ui }) => {
  const [forumTab, setForumTab] = useState<'posts' | 'dm'>('posts');
  const [tradeTab, setTradeTab] = useState<'shop' | 'player'>('shop');

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="note-paper flex max-h-[min(100dvh,100vh)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl shadow-xl sm:max-h-[85vh] sm:rounded-lg"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="dossier-modal-header flex shrink-0 items-center justify-between gap-3 px-4">
              <div className="dossier-modal-title flex min-w-0 items-center gap-2.5 font-heading text-xl text-white sm:text-2xl">
                {active === 'inventory' && <Backpack className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'hunting' && <Users className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'forum' && <MessageSquare className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'trade' && <Store className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'dungeons' && <Castle className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'leaderboard' && <Trophy className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                {active === 'season' && <CalendarDays className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />}
                <span className="truncate">{titleFor(active)}</span>
              </div>
              <button
                type="button"
                className="dossier-modal-close touch-manipulation shrink-0 rounded-lg p-1.5 sm:p-1.5"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.75} aria-hidden />
              </button>
            </header>

            <div className="safe-pb-nav min-h-0 flex-1 overflow-y-auto p-3 text-sm [-webkit-overflow-scrolling:touch] sm:p-4">
              {active === 'inventory' && <InventoryBody ui={ui} />}
              {active === 'hunting' && <HuntingBody ui={ui} />}
              {active === 'forum' && (
                <ForumBody ui={ui} tab={forumTab} setTab={setForumTab} />
              )}
              {active === 'trade' && (
                <TradeBody ui={ui} tab={tradeTab} setTab={setTradeTab} />
              )}
              {active === 'dungeons' && <DungeonsBody ui={ui} />}
              {active === 'leaderboard' && <LeaderboardBody ui={ui} />}
              {active === 'season' && <SeasonBody ui={ui} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function titleFor(id: ModalId): string {
  const m: Record<ModalId, string> = {
    inventory: '背包',
    hunting: '狩猎名单',
    forum: '玩家论坛',
    trade: '交易行',
    dungeons: '副本',
    leaderboard: '排行榜',
    season: '赛季信息',
  };
  return m[id];
}

function InventoryBody({ ui }: { ui: GameUi }) {
  const { inventory } = ui;
  const itemCount = inventory.items.reduce((sum, it) => sum + it.count, 0);
  return (
    <div className="space-y-3">
      <p className="text-xs text-game-text-muted">
        <span className="title-underlay-sm text-game-accent">负重</span>{' '}
        {inventory.currentWeight} / {inventory.maxWeight} 格
        {inventory.items.length > 0 ? (
          <>
            {' '}
            · 共 {inventory.items.length} 种 / {itemCount} 件
          </>
        ) : null}
      </p>
      {inventory.items.length === 0 ? (
        <Empty hint="暂无物品（获得物品后会显示名称与数量）" />
      ) : (
        <InventoryGrid items={inventory.items} />
      )}
    </div>
  );
}

function HuntMetaLine({
  race,
  talent,
  semenQuality,
  estimatedSP,
}: {
  race: string;
  talent: string;
  semenQuality: string;
  estimatedSP: number;
}) {
  return (
    <p className="text-xs text-game-text-muted">
      种族 {race.trim() || '—'} · 天赋 {talent.trim() || '—'} · 精液质量 {semenQuality} · 预计 SP{' '}
      {estimatedSP}
    </p>
  );
}

function HuntingBody({ ui }: { ui: GameUi }) {
  const { huntingList } = ui;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-heading mb-2 text-base">
          <span className="title-underlay text-game-accent">正在狩猎</span>
          <span className="ml-2 text-xs font-normal text-game-text-muted">
            ({huntingList.targets.length} 人)
          </span>
        </h3>
        {huntingList.targets.length === 0 ? (
          <Empty hint="暂无狩猎目标（标记猎物后会显示于此）" />
        ) : (
          <ul className="space-y-2">
            {huntingList.targets.map(t => (
              <li key={t.uid || `${t.name}-${t.nickname}`} className="dossier-card space-y-1 rounded-lg p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-game-text">
                    {t.name || '未命名'}
                    {t.nickname ? (
                      <span className="text-xs font-normal text-game-text-muted"> ({t.nickname})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-game-text-muted">{t.location || '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-game-text-muted">
                  <span>沦陷 {t.corruption}%</span>
                  <span className="text-right">状态：{t.status || '—'}</span>
                </div>
                <HuntMetaLine
                  race={t.race}
                  talent={t.talent}
                  semenQuality={t.semenQuality}
                  estimatedSP={t.estimatedSP}
                />
                <ClothingPanel clothing={t.clothing} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="font-heading mb-2 text-base">
          <span className="title-underlay text-game-accent">已调教</span>
          <span className="ml-2 text-xs font-normal text-game-text-muted">
            ({huntingList.slaves.length} 人)
          </span>
        </h3>
        {huntingList.slaves.length === 0 ? (
          <Empty hint="暂无已调教角色（沦陷完成后会转入此列表）" />
        ) : (
          <ul className="space-y-2">
            {huntingList.slaves.map(s => (
              <li key={s.uid || `${s.name}-${s.nickname}`} className="dossier-card space-y-1 rounded-lg p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-game-text">
                    {s.name || '未命名'}
                    {s.nickname ? (
                      <span className="text-xs font-normal text-game-text-muted"> ({s.nickname})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-game-text-muted">{s.location || '—'}</span>
                </div>
                <p className="text-xs text-game-text-muted">用途：{s.purpose || '—'}</p>
                <HuntMetaLine
                  race={s.race}
                  talent={s.talent}
                  semenQuality={s.semenQuality}
                  estimatedSP={s.estimatedSP}
                />
                <ClothingPanel clothing={s.clothing} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ForumBody({
  ui,
  tab,
  setTab,
}: {
  ui: GameUi;
  tab: 'posts' | 'dm';
  setTab: (t: 'posts' | 'dm') => void;
}) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const openPost = openPostId ? ui.forumPosts.find(p => p.id === openPostId) : undefined;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={`button-retro px-3 py-1 rounded-lg text-xs ${tab === 'posts' ? 'ring-2 ring-game-primary' : ''}`}
          onClick={() => {
            setTab('posts');
            setOpenPostId(null);
          }}
        >
          帖子
        </button>
        <button
          type="button"
          className={`button-retro px-3 py-1 rounded-lg text-xs ${tab === 'dm' ? 'ring-2 ring-game-primary' : ''}`}
          onClick={() => {
            setTab('dm');
            setOpenPostId(null);
          }}
        >
          私信
        </button>
      </div>
      {tab === 'posts' &&
        (ui.forumPosts.length === 0 ? (
          <Empty hint="暂无帖子" />
        ) : openPost ? (
          <ForumPostDetail post={openPost} worldDate={ui.world.date} onBack={() => setOpenPostId(null)} />
        ) : (
          <ul className="space-y-2">
            {ui.forumPosts.map((p, i) => (
              <li key={p.id}>
                <motion.button
                  type="button"
                  className="forum-file-row touch-manipulation flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3.5 text-left"
                  onClick={() => setOpenPostId(p.id)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.28 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="min-w-0 flex-1 font-heading text-base leading-snug text-game-text line-clamp-2">
                    {p.title}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-game-secondary" aria-hidden />
                </motion.button>
              </li>
            ))}
          </ul>
        ))}
      {tab === 'dm' &&
        (ui.privateMessages.length === 0 ? (
          <Empty hint="暂无私信" />
        ) : (
          <ul className="space-y-2">
            {ui.privateMessages.map(m => (
              <li key={m.id} className="dossier-card rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

function ForumPostDetail({
  post,
  worldDate,
  onBack,
}: {
  post: ForumPost;
  worldDate: string;
  onBack: () => void;
}) {
  return (
    <motion.article
      className="forum-post-detail space-y-4 rounded-lg p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className="touch-manipulation button-retro inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-600"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        返回列表
      </button>
      <h2 className="font-heading text-xl leading-tight text-game-text sm:text-2xl">
        <span className="title-underlay">{post.title}</span>
      </h2>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{post.content}</div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-game-border/60 pt-3 text-xs text-gray-500">
        <span>
          发帖人：
          <span className={post.isAnonymous ? 'text-gray-400 italic' : 'text-game-text'}>
            {post.author}
          </span>
        </span>
        <span>发帖时间：{post.time || '—'}</span>
      </footer>
      {worldDate ? (
        <p className="text-[10px] text-gray-400">游戏降临日起：{worldDate}（论坛时间不应早于此）</p>
      ) : null}
    </motion.article>
  );
}

function TradeBody({
  ui,
  tab,
  setTab,
}: {
  ui: GameUi;
  tab: 'shop' | 'player';
  setTab: (t: 'shop' | 'player') => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={`button-retro px-3 py-1 rounded-lg text-xs ${tab === 'shop' ? 'ring-2 ring-game-primary' : ''}`}
          onClick={() => setTab('shop')}
        >
          系统商城
        </button>
        <button
          type="button"
          className={`button-retro px-3 py-1 rounded-lg text-xs ${tab === 'player' ? 'ring-2 ring-game-primary' : ''}`}
          onClick={() => setTab('player')}
        >
          玩家交易
        </button>
      </div>
      {tab === 'shop' &&
        (ui.shopItems.length === 0 ? (
          <Empty hint="商城暂无上架" />
        ) : (
          <ShopGrid items={ui.shopItems} playerSp={ui.player.sp} />
        ))}
      {tab === 'player' &&
        (ui.playerTrades.length === 0 ? (
          <Empty hint="暂无玩家挂单" />
        ) : (
          <ul className="space-y-2">
            {ui.playerTrades.map(t => (
              <li key={t.id} className="dossier-card rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">{t.name}</span>
                  <span className="font-bold text-game-accent">{t.price}</span>
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{t.seller}</span>
                  <span>{t.time}</span>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

function DungeonsBody({ ui }: { ui: GameUi }) {
  const { dungeons } = ui;
  if (dungeons.length === 0) {
    return <Empty hint="暂无副本" />;
  }
  return (
    <ul className="space-y-3">
      {dungeons.map(d => (
        <li key={d.id} className="dossier-card rounded-lg p-3 space-y-2">
          <div className="flex justify-between gap-2">
            <span className="font-bold">{d.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-game-bg border border-game-border">
              难度 {d.difficulty}
            </span>
          </div>
          <p className="text-xs text-gray-500">{d.location}</p>
          <p className="whitespace-pre-wrap text-gray-700">{d.content}</p>
          <p className="text-xs text-game-primary">奖励：{d.reward}</p>
        </li>
      ))}
    </ul>
  );
}

function LeaderboardBody({ ui }: { ui: GameUi }) {
  const { leaderboard } = ui;
  if (leaderboard.length === 0) {
    return <Empty hint="排行榜为空" />;
  }
  return (
    <ol className="space-y-2">
      {leaderboard.map(e => (
        <li
          key={`${e.rank}-${e.nickname}`}
          className="dossier-card flex items-center justify-between rounded-lg px-3 py-2"
        >
          <span className="font-heading w-10 text-game-accent">#{e.rank}</span>
          <span className="flex-1">{e.nickname}</span>
          {e.score != null && <span className="text-xs text-gray-400">{e.score}</span>}
        </li>
      ))}
    </ol>
  );
}

function SeasonBody({ ui }: { ui: GameUi }) {
  const { seasonInfo } = ui;
  return (
    <div className="space-y-2 text-base">
      <p>
        <span className="title-underlay-sm text-sm text-gray-600">赛季名称</span>
        <br />
        <span className="font-heading text-xl">{seasonInfo.name}</span>
      </p>
      <p className="text-sm">
        <span className="title-underlay-sm text-gray-600">预计持续</span> {seasonInfo.duration}
      </p>
    </div>
  );
}

const SHOP_GRID_SLOTS = 10;

function InventoryGrid({ items }: { items: GameUi['inventory']['items'] }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
      {items.map(it => (
        <div key={it.id} className="flex min-w-0 flex-col items-stretch">
          <div
            className="polaroid-slot flex aspect-square min-h-15 flex-col items-center justify-center gap-0.5 p-1.5 text-center sm:min-h-17"
            title={it.description.trim() || it.name}
          >
            <span className="line-clamp-3 text-[11px] font-bold leading-snug text-game-text sm:text-xs">
              {it.name}
            </span>
          </div>
          <p className="polaroid-price mt-1.5 text-center text-xs sm:text-sm">×{it.count}</p>
        </div>
      ))}
    </div>
  );
}

function ShopGrid({ items, playerSp }: { items: GameUi['shopItems']; playerSp: number }) {
  const slots = items.slice(0, SHOP_GRID_SLOTS);
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-gray-500">
        当前 SP：<span className="font-bold text-game-accent">{playerSp}</span>
      </p>
      <div className="grid grid-cols-5 grid-rows-2 gap-2 sm:gap-2.5">
        {slots.map(s => (
          <div key={s.id} className="flex min-w-0 flex-col items-stretch">
            <div
              className="polaroid-slot flex aspect-square min-h-15 flex-col items-center justify-center gap-0.5 p-1.5 text-center sm:min-h-17"
              title={s.note}
            >
              <span className="line-clamp-3 text-[11px] font-bold leading-snug text-game-text sm:text-xs">
                {s.name}
              </span>
            </div>
            <p className="polaroid-price mt-1.5 text-center text-xs sm:text-sm">{s.price} SP</p>
          </div>
        ))}
      </div>
      {items.length > SHOP_GRID_SLOTS ? (
        <p className="text-center text-[10px] text-gray-400">另有 {items.length - SHOP_GRID_SLOTS} 件未显示</p>
      ) : null}
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <p className="text-center text-gray-400 py-8 border border-dashed border-game-border rounded-lg">{hint}</p>
  );
}
