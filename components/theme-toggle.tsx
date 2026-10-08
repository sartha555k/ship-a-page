'use client';
import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
function subscribe(callback: () => void) {
  window.addEventListener('themechange', callback);
  const storage = () => { try { const t = localStorage.getItem('ships-theme'); document.documentElement.dataset.theme = t === 'dark' || t === 'light' ? t : media.matches ? 'dark' : 'light'; } catch {} callback(); };
  window.addEventListener('storage', storage);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => { if (!(() => { try { return localStorage.getItem('ships-theme'); } catch { return null; } })()) { document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'; callback(); } };
  media.addEventListener('change', update);
  return () => { window.removeEventListener('themechange', callback); window.removeEventListener('storage', storage); media.removeEventListener('change', update); };
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === 'dark', () => false);
  return <button className="theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => {
    const theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('ships-theme', theme); } catch { /* still works without persistence */ }
    window.dispatchEvent(new Event('themechange'));
  }}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
