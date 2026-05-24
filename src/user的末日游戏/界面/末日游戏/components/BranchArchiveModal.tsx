import React, { useEffect, useState } from 'react';
import { GitBranch, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import toastr from 'toastr';
import { listAssistantFloorsParsed, type AssistantFloorSlice } from '../utils/messageParser';

interface BranchArchiveModalProps {
  open: boolean;
  onClose: () => void;
}

function previewSum(text: string, n = 120): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) {
    return '（本楼无摘要）';
  }
  if (t.length <= n) {
    return t;
  }
  return `${t.slice(0, n)}…`;
}

export const BranchArchiveModal: React.FC<BranchArchiveModalProps> = ({ open, onClose }) => {
  const [floors, setFloors] = useState<AssistantFloorSlice[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setFloors(listAssistantFloorsParsed());
    }
  }, [open]);

  const handleBranchFromFloor = async (messageId: number) => {
    if (pendingId !== null) {
      return;
    }
    setPendingId(messageId);
    try {
      await triggerSlash(`/branch-create ${messageId}`);
      toastr.success(`已从第 ${messageId} 楼创建分支`);
      onClose();
    } catch (e) {
      console.error('[BranchArchiveModal] branch-create:', e);
      const msg = e instanceof Error ? e.message : String(e);
      toastr.error(msg || '创建分支失败');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="读档"
            className="note-paper flex max-h-[min(100dvh,100vh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl shadow-xl sm:max-h-[88vh] sm:rounded-lg"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="safe-pt-header flex shrink-0 items-center justify-between gap-3 border-b border-game-border bg-game-bg/80 px-4 py-3">
              <span className="title-underlay flex items-center gap-2 font-heading text-base text-game-text sm:text-lg">
                <GitBranch className="h-5 w-5 shrink-0 text-game-primary" />
                读档（从楼层创建分支）
              </span>
              <button
                type="button"
                className="touch-manipulation button-retro rounded-lg p-2.5 text-game-text hover:bg-white sm:p-2"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </header>
            <p className="shrink-0 border-b border-game-border/80 bg-game-bg/40 px-4 py-2 text-[11px] leading-snug text-gray-500 sm:text-xs">
              点击某一楼层将执行 <code className="rounded bg-white/80 px-1">/branch-create</code>，从该楼创建新分支并跳转。
            </p>
            <div className="safe-pb-nav min-h-0 flex-1 overflow-y-auto p-3 [-webkit-overflow-scrolling:touch] sm:p-4">
              {floors.length === 0 ? (
                <p className="py-8 text-center text-gray-400">暂无 assistant 楼层</p>
              ) : (
                <ul className="space-y-2">
                  {floors.map(f => {
                    const busy = pendingId === f.messageId;
                    return (
                      <li key={f.messageId}>
                        <button
                          type="button"
                          disabled={pendingId !== null}
                          className="touch-manipulation button-retro flex w-full flex-col items-stretch gap-1 rounded-lg border border-game-border bg-white/90 px-3 py-2.5 text-left text-sm shadow-sm transition-colors hover:bg-game-bg disabled:opacity-60"
                          onClick={() => void handleBranchFromFloor(f.messageId)}
                        >
                          <span className="title-underlay-sm font-bold text-game-accent">第 {f.messageId} 楼</span>
                          <span className="text-xs leading-relaxed text-game-text">{previewSum(f.sum)}</span>
                          {busy && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-game-primary">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              创建分支中…
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
