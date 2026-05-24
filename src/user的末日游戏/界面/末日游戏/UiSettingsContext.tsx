import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fontPresetToFamily,
  loadUiSettingsFromChat,
  saveUiSettingsToChat,
  type UiSettings,
  UiSettingsSchema,
} from './uiSettings';
import { applyWorldbookOutputMode } from './worldbookOutputMode';

type UiSettingsContextValue = {
  settings: UiSettings;
  setSettings: React.Dispatch<React.SetStateAction<UiSettings>>;
  patchSettings: (partial: Partial<UiSettings>) => void;
  reloadFromChat: () => void;
};

const UiSettingsContext = createContext<UiSettingsContextValue | null>(null);

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(() => loadUiSettingsFromChat());

  /** 挂载时按聊天变量中的输出模式对齐世界书条目（与界面设置一致） */
  useEffect(() => {
    void applyWorldbookOutputMode(settings.outputMode === 'dual' ? 'dual' : 'single').catch(err => {
      console.warn('[末日游戏 UI] 初始化世界书输出模式失败', err);
    });
  }, []);

  useEffect(() => {
    saveUiSettingsToChat(settings);
  }, [settings]);

  const patchSettings = useCallback((partial: Partial<UiSettings>) => {
    setSettings(prev => UiSettingsSchema.parse({ ...prev, ...partial }));
  }, []);

  const reloadFromChat = useCallback(() => {
    setSettings(loadUiSettingsFromChat());
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, patchSettings, reloadFromChat }),
    [settings, patchSettings, reloadFromChat],
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings(): UiSettingsContextValue {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) {
    throw new Error('useUiSettings must be used within UiSettingsProvider');
  }
  return ctx;
}

export function useUiFontStyle(): React.CSSProperties {
  const { settings } = useUiSettings();
  return useMemo(
    () => ({
      fontSize: `${settings.fontSizePx}px`,
      fontFamily: fontPresetToFamily(settings.fontPreset),
    }),
    [settings.fontSizePx, settings.fontPreset],
  );
}
