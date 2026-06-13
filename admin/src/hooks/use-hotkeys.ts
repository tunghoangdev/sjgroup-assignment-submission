'use client';

import { useEffect, useCallback } from 'react';

interface HotkeyConfig {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  callback: (e: KeyboardEvent) => void;
}

export function useHotkey(config: HotkeyConfig) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, preventDefault = true, callback } = config;

      const isMeta = metaKey !== undefined ? e.metaKey === metaKey : true;
      const isCtrl = ctrlKey !== undefined ? e.ctrlKey === ctrlKey : true;
      const isShift = shiftKey !== undefined ? e.shiftKey === shiftKey : true;

      if (e.key !== key) return;
      if (!isMeta || !isCtrl || !isShift) return;

      if (preventDefault) e.preventDefault();
      callback(e);
    },
    [config]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useHotkeys(configs: HotkeyConfig[]) {
  configs.forEach(useHotkey);
}
