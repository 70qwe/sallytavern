import { ChevronDown } from 'lucide-react';
import type { Clothing } from '../types';
import { CLOTHING_SLOTS, clothingHasAny } from '../clothing';

function displayValue(s: string, emptyText: string): string {
  return s.trim() || emptyText;
}

export function ClothingPanel({
  clothing,
  compact = false,
  collapsible = false,
  title = '衣着',
  emptyText = '—',
}: {
  clothing: Clothing;
  compact?: boolean;
  collapsible?: boolean;
  title?: string;
  emptyText?: string;
}) {
  if (!clothingHasAny(clothing) && compact) {
    return null;
  }

  const rows = (
    <div className={compact ? 'space-y-0.5' : 'grid grid-cols-2 gap-x-2 gap-y-0.5'}>
      {CLOTHING_SLOTS.map(slot => (
        <div key={slot} className={compact ? '' : 'min-w-0'}>
          <span className="text-gray-500">{slot}：</span>
          <span className="text-game-text">{displayValue(clothing[slot], emptyText)}</span>
        </div>
      ))}
    </div>
  );

  if (collapsible) {
    return (
      <details className="group/cloth text-xs text-game-text-muted" open>
        <summary className="touch-manipulation flex cursor-pointer list-none items-center justify-between gap-2 rounded py-1 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="title-underlay-sm font-bold text-game-text">{title}</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-game-primary transition-transform group-open/cloth:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-1.5 pb-0.5">{rows}</div>
      </details>
    );
  }

  return (
    <div className="space-y-1 text-xs text-game-text-muted">
      <div className="title-underlay-sm text-game-text">{title}</div>
      {rows}
    </div>
  );
}
