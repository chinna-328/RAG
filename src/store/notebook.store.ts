import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type Settings } from '@shared/types';

type State = {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
};

export const useSettingsStore = create<State>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'lumen.settings' }
  )
);
