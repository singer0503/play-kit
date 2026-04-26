import { useSyncExternalStore } from 'react';
import { isSSR } from './is-ssr';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (callback: () => void): (() => void) => {
  if (isSSR()) return () => undefined;
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
};

const getSnapshot = (): boolean => {
  if (isSSR()) return false;
  return window.matchMedia(QUERY).matches;
};

const getServerSnapshot = (): boolean => false;

// 若 true，game component 應縮短或略過動畫，或直接跳到終態。
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
