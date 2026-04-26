import type { Prize } from '../../../core/types';

export const winPrize: Prize = { id: 'w', label: { 'zh-TW': '$100', en: '$100' }, win: true };
export const losePrize: Prize = { id: 'l', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false };
