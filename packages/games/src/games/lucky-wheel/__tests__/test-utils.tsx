import type { LuckyWheelPrize } from '../types';

export { makeWrapper, stubMatchMedia } from '../../../test-utils';

// 所有 LuckyWheel 測試共用的獎品池
export const demoPrizes: LuckyWheelPrize[] = [
  { id: 'p1', label: { 'zh-TW': '$100', en: '$100' }, win: true, weight: 1, color: '#e63946' },
  { id: 'p2', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, color: '#444' },
  { id: 'p3', label: { 'zh-TW': '$20', en: '$20' }, win: true, weight: 2, color: '#6a4cff' },
  { id: 'p4', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, color: '#444' },
  { id: 'p5', label: { 'zh-TW': '$5', en: '$5' }, win: true, weight: 3, color: '#2a9d8f' },
  { id: 'p6', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, color: '#444' },
  {
    id: 'p7',
    label: { 'zh-TW': 'JACKPOT', en: 'JACKPOT' },
    win: true,
    weight: 1,
    color: '#f4a261',
  },
  { id: 'p8', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, color: '#444' },
];
