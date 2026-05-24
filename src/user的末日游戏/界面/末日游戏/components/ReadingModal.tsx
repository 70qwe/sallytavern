import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { listAssistantFloorsParsed, type AssistantFloorSlice } from '../utils/messageParser';

interface ReadingModalProps {
  open: boolean;
  onClose: () => void;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({ open, onClose }) => {
  const [floors, setFloors] = useState<AssistantFloorSlice[]>([]);

  useEffect(() => {
    if (open) {
      setFloors(listAssistantFloorsParsed());
    }
  }, [open]);

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
            aria-label="阅读模式"
            className="note-paper flex max-h-[min(100dvh,100vh)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl shadow-xl sm:max-h-[88vh] sm:rounded-lg"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="safe-pt-header flex shrink-0 items-center justify-between gap-3 border-b border-game-border bg-game-bg/80 px-4 py-3">
              <span className="title-underlay font-heading text-base text-game-text sm:text-lg">阅读模式</span>
              <button
                type="button"
                className="touch-manipulation button-retro rounded-lg p-2.5 text-game-text hover:bg-white sm:p-2"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </header>
            <div className="safe-pb-nav min-h-0 flex-1 overflow-y-auto p-3 text-sm [-webkit-overflow-scrolling:touch] sm:p-4">
              {floors.length === 0 ? (
                <p className="py-8 text-center text-gray-400">暂无 assistant 楼层或未解析到 &lt;maintext&gt;</p>
              ) : (
                <ul className="space-y-4">
                  {floors.map(f => (
                    <li
                      key={f.messageId}
                      className="dossier-card rounded-lg p-3"
                    >
                      <div className="title-underlay-sm mb-2 inline-block text-xs font-bold text-game-accent">
                        第 {f.messageId} 楼
                      </div>
                      <p className="whitespace-pre-wrap text-game-text leading-relaxed">
                        {f.maintext.trim() || '（本楼无 maintext）'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
