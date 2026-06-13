import type { Clothing } from '../types';
import { CLOTHING_SLOTS, clothingHasAny } from '../clothing';

function line(s: string): string {
  return s.trim() || '—';
}

export function ClothingPanel({
  clothing,
  compact = false,
}: {
  clothing: Clothing;
  compact?: boolean;
}) {
  if (!clothingHasAny(clothing) && compact) {
    return null;
  }

  return (
    <div className="space-y-1 text-xs text-game-text-muted">
      <div className="title-underlay-sm text-game-text">衣着</div>
      <div className={compact ? 'space-y-0.5' : 'grid grid-cols-2 gap-x-2 gap-y-0.5'}>
        {CLOTHING_SLOTS.map(slot => (
          <div key={slot} className={compact ? '' : 'min-w-0'}>
            <span className="text-gray-500">{slot}：</span>
            <span className="text-game-text">{line(clothing[slot])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
