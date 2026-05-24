import React, { useState } from 'react';
import { Archive, BookOpen, Loader2, Maximize2, Minimize2, RefreshCw, Settings } from 'lucide-react';
import toastr from 'toastr';
import { TH_DUAL_API_REROLL } from '../../../dualApiEvents';

interface StoryToolbarProps {
  onOpenReading: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showRerollVariables?: boolean;
}

export const StoryToolbar: React.FC<StoryToolbarProps> = ({
  onOpenReading,
  onOpenArchive,
  onOpenSettings,
  fullscreen,
  onToggleFullscreen,
  showRerollVariables = false,
}) => {
  const [rerollBusy, setRerollBusy] = useState(false);

  const onRerollVariables = async () => {
    setRerollBusy(true);
    try {
      await eventEmit(TH_DUAL_API_REROLL);
    } catch (e) {
      console.error('[工具栏] 变量重 roll', e);
      toastr.error(e instanceof Error ? e.message : '变量重 roll 失败');
    } finally {
      setRerollBusy(false);
    }
  };

  return (
    <div className="dossier-header-strip flex shrink-0 flex-wrap items-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3">
      <button
        type="button"
        className="touch-manipulation button-retro inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-game-text sm:text-xs"
        onClick={onOpenReading}
      >
        <BookOpen className="h-4 w-4 shrink-0 text-game-primary" />
        阅读模式
      </button>
      <button
        type="button"
        className="touch-manipulation button-retro inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-game-text sm:text-xs"
        onClick={onOpenArchive}
      >
        <Archive className="h-4 w-4 shrink-0 text-game-primary" />
        读档
      </button>
      {showRerollVariables && (
        <button
          type="button"
          disabled={rerollBusy}
          className="touch-manipulation button-retro inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-game-text disabled:opacity-50 sm:text-xs"
          onClick={() => void onRerollVariables()}
          title="最新楼层剧情已有但变量未更新时使用"
        >
          {rerollBusy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-game-primary" />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0 text-game-primary" />
          )}
          变量重roll
        </button>
      )}
      <button
        type="button"
        className="touch-manipulation button-retro inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-game-text sm:text-xs"
        onClick={onOpenSettings}
        aria-label="界面设置"
      >
        <Settings className="h-4 w-4 shrink-0 text-game-primary" />
        设置
      </button>
      <button
        type="button"
        className="touch-manipulation button-retro ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-game-text sm:text-xs"
        onClick={onToggleFullscreen}
        aria-pressed={fullscreen}
      >
        {fullscreen ? (
          <Minimize2 className="h-4 w-4 shrink-0 text-game-primary" />
        ) : (
          <Maximize2 className="h-4 w-4 shrink-0 text-game-primary" />
        )}
        {fullscreen ? '退出全屏' : '全屏'}
      </button>
    </div>
  );
};
