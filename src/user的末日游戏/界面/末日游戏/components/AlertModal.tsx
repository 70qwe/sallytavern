import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  tone?: 'success' | 'error' | 'info';
  confirmLabel?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  title,
  children,
  tone = 'info',
  confirmLabel = '知道了',
}) => {
  const ring =
    tone === 'success'
      ? 'ring-game-primary'
      : tone === 'error'
        ? 'ring-red-400'
        : 'ring-game-accent';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="th-alert-modal-title"
            className={`note-paper w-full max-w-sm rounded-xl border border-game-border bg-white p-5 shadow-xl ring-2 ${ring}`}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 id="th-alert-modal-title" className="title-underlay font-heading text-lg text-game-text">
                {title}
              </h2>
              <button
                type="button"
                className="touch-manipulation rounded-lg p-1.5 text-game-text hover:bg-game-bg"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm leading-relaxed text-gray-700">{children}</div>
            <button
              type="button"
              className="touch-manipulation button-retro mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-bold text-game-text"
              onClick={onClose}
            >
              {confirmLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
