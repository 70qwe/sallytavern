import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Send, Sparkles, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useChatSend } from '../hooks/useChatSend';
import type { ChatLine } from '../mvuMap';
import type { ActionOption } from '../types';
import { StoryToolbar } from './StoryToolbar';

interface ChatAreaProps {
  messages: ChatLine[];
  actions: ActionOption[];
  onActionSelect: (action: ActionOption) => void;
  onOpenReading: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showRerollVariables?: boolean;
  onStoryRefresh?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  actions,
  onActionSelect,
  onOpenReading,
  onOpenArchive,
  onOpenSettings,
  fullscreen,
  onToggleFullscreen,
  showRerollVariables,
  onStoryRefresh,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const { draft, setDraft, sending, send, composingRef } = useChatSend({
    onAfterSend: onStoryRefresh,
  });

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) {
      return;
    }
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [draft]);

  const handleOptionClick = (action: ActionOption) => {
    setDraft(action.description);
    onActionSelect(action);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none note-paper">
      <StoryToolbar
        onOpenReading={onOpenReading}
        onOpenArchive={onOpenArchive}
        onOpenSettings={onOpenSettings}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        showRerollVariables={showRerollVariables}
      />
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 pb-4 [-webkit-overflow-scrolling:touch] sm:space-y-6 sm:p-6 sm:pb-5"
      >
        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={`flex gap-2 sm:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm sm:h-10 sm:w-10 ${
                  m.role === 'assistant' ? 'chat-avatar-assistant' : 'chat-avatar-user'
                }`}
              >
                {m.role === 'assistant' ? (
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <div
                className={`max-w-[min(92%,22rem)] rounded-xl p-3 leading-relaxed sm:max-w-[85%] sm:p-4 ${
                  m.role === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'
                }`}
              >
                {m.content ? <p className="whitespace-pre-wrap">{m.content}</p> : null}
                {m.role === 'assistant' && m.puppy ? (
                  <details className="puppy-theater mt-3 overflow-hidden rounded-lg open:shadow-sm">
                    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold text-amber-900/90 marker:content-none list-none [&::-webkit-details-marker]:hidden">
                      <span className="title-underlay-sm">{m.puppy.title}</span>
                    </summary>
                    <div className="border-t border-amber-200/50 px-3 py-2.5 text-sm leading-relaxed text-game-text whitespace-pre-wrap">
                      {m.puppy.body}
                    </div>
                  </details>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="dossier-header-strip z-20 border-t border-game-border p-2 sm:p-3">
        <button
          type="button"
          disabled={actions.length === 0}
          className="touch-manipulation button-retro mb-2 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-game-text enabled:active:bg-game-paper disabled:cursor-not-allowed disabled:opacity-50 sm:mb-3 sm:py-2"
          onClick={() => setOptionsOpen(o => !o)}
          aria-expanded={actions.length === 0 ? undefined : optionsOpen}
        >
          <span>
            {actions.length === 0
              ? '暂无选项'
              : optionsOpen
                ? `收起选项（${actions.length}）`
                : `展开选项（${actions.length}）`}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-game-primary transition-transform ${optionsOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {optionsOpen && actions.length > 0 && (
          <div className="mb-2 max-h-[min(42vh,22rem)] overflow-y-auto [-webkit-overflow-scrolling:touch] sm:mb-3 sm:max-h-[min(38vh,20rem)]">
            <div className="grid grid-cols-1 gap-1.5 pb-1">
              {actions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleOptionClick(action)}
                  className="touch-manipulation button-retro flex w-full min-h-0 flex-col items-stretch justify-center rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-game-bg active:bg-game-bg sm:px-3 sm:py-2"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-game-accent sm:text-xs">
                    选项 {action.type}
                  </span>
                  <span className="mt-1 line-clamp-3 text-xs leading-snug text-gray-400 sm:line-clamp-2 sm:text-sm">
                    {action.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative flex items-end gap-1 rounded-xl border-2 border-game-border bg-game-paper-bright p-1.5 shadow-inner transition-all duration-300 focus-within:border-game-accent focus-within:ring-2 focus-within:ring-game-accent/25 sm:gap-2 sm:p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            placeholder={
              sending ? '正在等待主 API 回复…' : '输入行动或对话，Enter 发送，Shift+Enter 换行'
            }
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-game-text placeholder:text-gray-400 focus:outline-none sm:min-h-[2.75rem] sm:px-3"
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
                e.preventDefault();
                void send();
              }
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
          />
          <button
            type="button"
            disabled={sending || !draft.trim()}
            className="touch-manipulation mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-game-accent text-[#f8f0e6] shadow-md transition-all duration-200 hover:translate-y-[-1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
            aria-label="发送消息"
            onClick={() => void send()}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
