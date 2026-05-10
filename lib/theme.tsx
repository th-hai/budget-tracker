import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeStyle = 'calm' | 'playful';
export type ChartType = 'donut' | 'bar' | 'stacked' | 'daily';
export type Density = 'compact' | 'roomy';

const STORAGE_KEYS = {
  style: 'budgetddy-theme',
  dark: 'budgetddy-dark',
  chart: 'budgetddy-chart',
  density: 'budgetddy-density',
};

export const ACCENT = '#4ECDC4';

export const THEME = {
  calm: {
    name: 'Calm',
    accent: ACCENT,
  },
  playful: {
    name: 'Playful',
    accent: ACCENT,
  },
} as const;

interface ThemeContextValue {
  style: ThemeStyle;
  setStyle: (style: ThemeStyle) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  density: Density;
  setDensity: (density: Density) => void;
  accent: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function applyTheme(style: ThemeStyle, dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.classList.toggle('theme-calm', style === 'calm');
  root.classList.toggle('theme-playful', style === 'playful');
  root.style.setProperty('--accent', ACCENT);
}

function readStorage<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key) as T | null;
  return value && allowed.includes(value) ? value : fallback;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [style, setStyleState] = useState<ThemeStyle>('calm');
  const [dark, setDarkState] = useState(false);
  const [chartType, setChartTypeState] = useState<ChartType>('donut');
  const [density, setDensityState] = useState<Density>('roomy');

  useEffect(() => {
    setStyleState(readStorage<ThemeStyle>(STORAGE_KEYS.style, 'calm', ['calm', 'playful']));
    setDarkState(typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEYS.dark) === 'true');
    setChartTypeState(readStorage<ChartType>(STORAGE_KEYS.chart, 'donut', ['donut', 'bar', 'stacked', 'daily']));
    setDensityState(readStorage<Density>(STORAGE_KEYS.density, 'roomy', ['compact', 'roomy']));
  }, []);

  useEffect(() => {
    applyTheme(style, dark);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.style, style);
    window.localStorage.setItem(STORAGE_KEYS.dark, String(dark));
    window.localStorage.setItem(STORAGE_KEYS.chart, chartType);
    window.localStorage.setItem(STORAGE_KEYS.density, density);
  }, [style, dark, chartType, density]);

  const value = useMemo<ThemeContextValue>(() => ({
    style,
    setStyle: setStyleState,
    dark,
    setDark: setDarkState,
    chartType,
    setChartType: setChartTypeState,
    density,
    setDensity: setDensityState,
    accent: ACCENT,
  }), [style, dark, chartType, density]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
