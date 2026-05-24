import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  MapPin,
  CloudRain,
  User,
  Zap,
  Droplets,
  Utensils,
  BarChart3,
  Dna,
} from 'lucide-react';
import type { WorldInfo, PlayerInfo, NightmarePhaseKey } from '../types';

interface SidebarProps {
  world: WorldInfo;
  player: PlayerInfo;
}

function worldLine(s: string): string {
  return s?.trim() ? s : '—';
}

export const Sidebar: React.FC<SidebarProps> = ({ world, player }) => {
  const [openAbilityPhase, setOpenAbilityPhase] = useState<NightmarePhaseKey | null>(null);
  const abilityLoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openAbilityPhase === null) {
      return;
    }
    const onDocMouseDown = (e: MouseEvent) => {
      if (abilityLoreRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpenAbilityPhase(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [openAbilityPhase]);

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto pr-0 sm:gap-4 md:w-80 md:pr-2">
      <motion.section
        className="note-paper dossier-slip p-3 sm:p-4 md:rotate-1"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-heading mb-3 flex items-center gap-2 text-xl">
          <Calendar className="h-5 w-5 shrink-0 text-game-primary" />
          <span className="title-underlay leading-tight">世界信息</span>
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="title-underlay-sm">时间</span>
            </span>
            <span className="text-right">{world.date}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="title-underlay-sm">地点</span>
            </span>
            <span className="text-right">{worldLine(world.location)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500">
              <CloudRain className="h-4 w-4 shrink-0" />
              <span className="title-underlay-sm">天气</span>
            </span>
            <span className="text-right text-game-primary">{worldLine(world.weather)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">
              <span className="title-underlay-sm">生存时间</span>
            </span>
            <span>第 {world.survivalDays} 天</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">
              <span className="title-underlay-sm">当前赛季</span>
            </span>
            <span className="font-bold text-game-accent">{worldLine(world.season)}</span>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="note-paper dossier-slip overflow-visible p-3 sm:p-4 md:-rotate-1"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-heading mb-3 flex items-center gap-2 text-xl">
          <User className="h-5 w-5 shrink-0 text-game-primary" />
          <span className="title-underlay leading-tight">玩家信息</span>
        </h2>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
            <span>UID: {player.uid}</span>
            <span className="text-right">种族: {player.race}</span>
          </div>

          <div className="flex items-end justify-between">
            <span className="text-lg font-bold">{player.name}</span>
            <span className="text-xs text-gray-500">昵称: {player.nickname}</span>
          </div>

          <div className="space-y-1 overflow-visible pt-1">
            <div className="flex justify-between text-xs">
              <span>
                <span className="title-underlay-sm">天赋</span>:{' '}
                <span className="font-bold text-game-accent">{player.talent}</span>
              </span>
              <span>
                <span className="title-underlay-sm">阶段</span>: {player.phase}
              </span>
            </div>
            <div ref={abilityLoreRef} className="relative">
              <div className="flex flex-wrap gap-1">
                {player.abilities.map(a => {
                  const hasLore = Boolean(a.detail?.trim());
                  const titleText = hasLore ? `${a.name}：${a.detail}` : a.description;
                  return (
                    <span key={a.phaseKey} className="inline-flex">
                      <button
                        type="button"
                        className="touch-manipulation rounded border border-game-border bg-game-paper-bright px-1.5 py-0.5 text-left text-[10px] text-game-accent-dark hover:bg-white"
                        title={titleText}
                        aria-expanded={hasLore ? openAbilityPhase === a.phaseKey : undefined}
                        onClick={() => {
                          if (!hasLore) {
                            return;
                          }
                          setOpenAbilityPhase(p => (p === a.phaseKey ? null : a.phaseKey));
                        }}
                      >
                        {a.name}
                      </button>
                    </span>
                  );
                })}
              </div>
              {openAbilityPhase &&
                (() => {
                  const a = player.abilities.find(x => x.phaseKey === openAbilityPhase);
                  if (!a?.detail?.trim()) {
                    return null;
                  }
                  return (
                    <div
                      role="tooltip"
                      className="absolute bottom-full left-0 right-0 z-[100] mb-1 flex justify-center px-0.5"
                    >
                      <div className="pointer-events-auto max-h-[min(50vh,22rem)] w-full max-w-[min(22rem,calc(100%-0.25rem))] overflow-y-auto whitespace-normal rounded-lg border border-game-border bg-game-paper-bright p-2.5 text-left text-[11px] leading-snug text-game-text shadow-md">
                        <div className="font-bold text-game-accent">{a.name}</div>
                        <p className="mt-1 text-gray-700">{a.detail}</p>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-game-border pt-2 text-center text-xs">
            <div>
              <Zap className="mx-auto mb-1 h-4 w-4 text-yellow-500" />
              <div className="text-gray-400">
                <span className="title-underlay-sm">SP</span>
              </div>
              <div className="font-bold">{player.sp}</div>
            </div>
            <div>
              <Droplets className="mx-auto mb-1 h-4 w-4 text-purple-500" />
              <div className="text-gray-400">
                <span className="title-underlay-sm">污染</span>
              </div>
              <div className="font-bold">{player.pollution}</div>
            </div>
            <div>
              <Utensils className="mx-auto mb-1 h-4 w-4 text-orange-500" />
              <div className="text-gray-400">
                <span className="title-underlay-sm">饱食</span>
              </div>
              <div className="font-bold">{player.fullness}</div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <StatBar label="力量" val={player.strength} color="bg-red-400" />
            <StatBar label="体质" val={player.constitution} color="bg-green-400" />
            <StatBar label="敏捷" val={player.agility} color="bg-blue-400" />
          </div>

          <div className="flex items-center justify-between border-t border-game-border pt-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">
                <span className="title-underlay-sm">总评</span>
              </span>
              <span className="font-heading text-lg text-game-accent">{player.rating}</span>
            </div>
            <Dna className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-xs italic leading-snug text-gray-500">{player.ratingComment}</p>
        </div>
      </motion.section>
    </div>
  );
};

const StatBar = ({
  label,
  val,
  color,
}: {
  label: string;
  val: { current: number; max: number };
  color: string;
}) => (
  <div>
    <div className="mb-1 flex justify-between text-[10px] text-gray-400">
      <span className="title-underlay-sm text-gray-500">{label}</span>
      <span>
        {val.current}/{val.max}
      </span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-game-border/30">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (val.current / Math.max(val.max, 1)) * 100)}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  </div>
);
