import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBrowserFullscreen } from './hooks/useBrowserFullscreen';
import toastr from 'toastr';
import {
  Backpack,
  CalendarDays,
  Castle,
  Crosshair,
  MessageSquare,
  MessagesSquare,
  Store,
  Trophy,
} from 'lucide-react';
import { BranchArchiveModal } from './components/BranchArchiveModal';
import { ChatArea } from './components/ChatArea';
import { ReadingModal } from './components/ReadingModal';
import { DualApiNotifyListener } from './components/DualApiNotifyListener';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { SystemModals, type ModalId } from './components/SystemModals';
import type { ChatLine } from './mvuMap';
import { statToGameUi } from './mvuMap';
import type { ActionOption } from './types';
import { useAssistantStory } from './useAssistantStory';
import { useMessageMvuData } from './useMessageMvuData';
import { useUiFontStyle, useUiSettings } from './UiSettingsContext';
import { applyWorldbookOutputMode } from './worldbookOutputMode';

const DOCK: { id: ModalId; icon: typeof Backpack; label: string }[] = [
  { id: 'inventory', icon: Backpack, label: '背包' },
  { id: 'hunting', icon: Crosshair, label: '狩猎' },
  { id: 'forum', icon: MessagesSquare, label: '论坛' },
  { id: 'trade', icon: Store, label: '交易' },
  { id: 'dungeons', icon: Castle, label: '副本' },
  { id: 'leaderboard', icon: Trophy, label: '排行' },
  { id: 'season', icon: CalendarDays, label: '赛季' },
];

type MobileMainTab = 'chat' | 'status';

export default function App() {
  const fontStyle = useUiFontStyle();
  const { settings, patchSettings } = useUiSettings();
  const { data } = useMessageMvuData();
  const ui = useMemo(() => statToGameUi(data), [data]);
  const {
    maintext,
    actionsFromParse,
    sourceMessageId,
    latestPuppy,
    storyLines,
    refresh: refreshStory,
  } = useAssistantStory();
  const [modal, setModal] = useState<ModalId | null>(null);
  const [mobileMain, setMobileMain] = useState<MobileMainTab>('chat');
  const [readingOpen, setReadingOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { rootRef, fullscreen, toggleFullscreen } = useBrowserFullscreen();

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          void eventEmit(iframe_events.MESSAGE_IFRAME_RENDER_ENDED, getIframeName());
        } catch {
          /* 非楼层 iframe 等场景忽略 */
        }
      });
    });
  }, [fullscreen]);

  /** 剧情区：仅最新一条 AI 主叙事（无用户楼、无气泡） */
  const chatLines: ChatLine[] = useMemo(() => {
    const fromStory = storyLines.filter(l => l.role === 'assistant').slice(-1);
    if (fromStory.length > 0) {
      return fromStory;
    }
    const t = maintext.trim();
    if (t || latestPuppy) {
      return [
        {
          id: `assistant-maintext-${sourceMessageId ?? 'current'}`,
          role: 'assistant' as const,
          content: t,
          puppy: latestPuppy,
        },
      ];
    }
    return [];
  }, [maintext, sourceMessageId, latestPuppy, storyLines]);

  /** 行动选项仅来自主 API 消息内 &lt;option&gt;（变量表已不含「下一步行动」） */
  const actionButtons: ActionOption[] = useMemo(() => actionsFromParse, [actionsFromParse]);

  const onActionSelect = useCallback((_action: ActionOption) => {
    /* 选项正文已在 ChatArea 内通过 send() 发出 */
  }, []);

  const dualModel = settings.dualApi?.model ?? '';
  const showDualApiSetupBanner = useMemo(
    () => settings.outputMode === 'dual' && !dualModel.trim(),
    [dualModel, settings.outputMode],
  );

  const onSwitchToSingleApi = useCallback(async () => {
    patchSettings({ outputMode: 'single' });
    try {
      await applyWorldbookOutputMode('single');
      toastr.success('已切换为单 API 世界书条目');
    } catch (e) {
      console.error('[末日游戏] 切换单 API 世界书失败', e);
      toastr.error(e instanceof Error ? e.message : '世界书切换失败');
    }
  }, [patchSettings]);

  const rootClass = fullscreen
    ? 'th-game-fs th-game-shell flex min-h-[100dvh] w-full min-w-0 flex-col overflow-hidden fixed inset-0 z-90'
    : 'th-game-shell flex w-full min-w-0 shrink-0 flex-col overflow-hidden';

  return (
    <div ref={rootRef} className={rootClass} style={fontStyle}>
      <div
        className={
          fullscreen
            ? 'th-game-main flex min-h-0 min-w-0 flex-1 flex-col'
            : 'th-game-main flex w-full shrink-0 flex-col'
        }
      >
      {/* 手机：剧情 / 状态 切换；md+ 隐藏 */}
      <div
        className="safe-pt-header dossier-header-strip flex shrink-0 md:hidden"
        role="tablist"
        aria-label="主内容切换"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileMain === 'chat'}
          className={`touch-manipulation flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-300 ${
            mobileMain === 'chat'
              ? 'border-b-2 border-game-accent text-game-accent bg-game-paper/40'
              : 'text-game-text-muted'
          }`}
          onClick={() => setMobileMain('chat')}
        >
          <MessageSquare className="h-5 w-5 shrink-0" />
          剧情
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileMain === 'status'}
          className={`touch-manipulation flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-300 ${
            mobileMain === 'status'
              ? 'border-b-2 border-game-accent text-game-accent bg-game-paper/40'
              : 'text-game-text-muted'
          }`}
          onClick={() => setMobileMain('status')}
        >
          <Backpack className="h-5 w-5 shrink-0" />
          状态
        </button>
      </div>

      <div
        className={
          fullscreen
            ? 'flex min-h-0 flex-1 flex-col gap-3 p-2 pb-0 sm:p-3 md:flex-row md:gap-3'
            : 'flex flex-col gap-3 p-2 pb-0 sm:p-3 md:flex-row md:items-start md:gap-3'
        }
      >
        {/* 桌面：侧栏始终显示；手机：仅「状态」页 */}
        <div
          className={`shrink-0 md:flex md:w-80 ${
            fullscreen ? 'min-h-0 md:overflow-y-auto' : ''
          } ${
            mobileMain === 'status'
              ? `flex ${fullscreen ? 'max-md:flex-1 max-md:overflow-y-auto' : 'max-md:max-h-128 max-md:overflow-y-auto'}`
              : 'hidden'
          }`}
        >
          <Sidebar world={ui.world} player={ui.player} fullscreen={fullscreen} />
        </div>

        {/* 桌面：聊天始终显示；手机：仅「剧情」页 */}
        <div
          className={`min-w-0 shrink-0 flex-col md:flex md:flex-1 ${
            mobileMain === 'chat' ? 'flex w-full' : 'hidden md:flex'
          } ${fullscreen ? 'min-h-0 flex-1' : ''}`}
        >
          <ChatArea
            messages={chatLines}
            actions={actionButtons}
            onActionSelect={onActionSelect}
            onOpenReading={() => setReadingOpen(true)}
            onOpenArchive={() => setArchiveOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            fullscreen={fullscreen}
            onToggleFullscreen={toggleFullscreen}
            showRerollVariables={settings.outputMode === 'dual'}
            onStoryRefresh={refreshStory}
          />
        </div>
      </div>

      <nav
        className="safe-pb-nav dossier-dock dossier-dock-scroll shrink-0"
        aria-label="系统功能"
      >
        <div className="dossier-dock-track flex min-h-[52px] w-max min-w-full flex-nowrap justify-start gap-2 px-2 py-2 sm:px-3 sm:py-3">
          {DOCK.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              className={`touch-manipulation button-retro flex shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold sm:py-2 ${
                modal === id ? 'ring-2 ring-game-accent bg-game-paper/25' : ''
              }`}
              onClick={() => setModal(m => (m === id ? null : id))}
            >
              <Icon className="h-5 w-5 shrink-0 text-game-paper-bright sm:h-4 sm:w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>
      </div>

      {showDualApiSetupBanner && (
        <div
          className="pointer-events-auto fixed inset-0 z-90 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="th-dual-api-setup-title"
        >
          <div className="note-paper max-w-md rounded-xl p-5 text-center">
            <p id="th-dual-api-setup-title" className="text-sm font-bold leading-relaxed text-game-text">
              打开设置填入副 API 以获得更好的体验。
              <br />
              或者选择单 API 模式进入游戏。
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="touch-manipulation rounded-lg bg-game-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
                onClick={() => setSettingsOpen(true)}
              >
                打开设置
              </button>
              <button
                type="button"
                className="touch-manipulation rounded-lg border border-game-border bg-game-bg px-4 py-2.5 text-sm font-bold text-game-text hover:bg-white"
                onClick={() => void onSwitchToSingleApi()}
              >
                单 API 模式
              </button>
            </div>
          </div>
        </div>
      )}

      <SystemModals active={modal} onClose={() => setModal(null)} ui={ui} />

      <ReadingModal open={readingOpen} onClose={() => setReadingOpen(false)} />
      <BranchArchiveModal open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DualApiNotifyListener />
    </div>
  );
}
