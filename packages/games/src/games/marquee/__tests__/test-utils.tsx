import type { MarqueePrize } from '../types';

export const demoPrizes: MarqueePrize[] = [
  { id: 'a', label: { 'zh-TW': '$100', en: '$100' }, win: true, weight: 1, icon: '💰' },
  { id: 'b', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎟️' },
  { id: 'c', label: { 'zh-TW': '$50', en: '$50' }, win: true, weight: 2, icon: '💎' },
  { id: 'd', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎫' },
  { id: 'e', label: { 'zh-TW': '$5', en: '$5' }, win: true, weight: 3, icon: '🪙' },
  { id: 'f', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎟️' },
];
