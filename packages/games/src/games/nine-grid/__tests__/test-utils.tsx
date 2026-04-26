import type { NineGridCell } from '../types';

export { makeWrapper, stubMatchMedia } from '../../../test-utils';

export const demoCells: NineGridCell[] = [
  { id: 'c1', label: { 'zh-TW': '$88', en: '$88' }, win: true, weight: 1, icon: '💎' },
  { id: 'c2', label: { 'zh-TW': '$10', en: '$10' }, win: true, weight: 2, icon: '🎁' },
  { id: 'c3', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎫' },
  { id: 'c4', label: { 'zh-TW': '$5', en: '$5' }, win: true, weight: 3, icon: '⭐' },
  { id: 'c5', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎟️' },
  { id: 'c6', label: { 'zh-TW': '$200', en: '$200' }, win: true, weight: 1, icon: '🏆' },
  { id: 'c7', label: { 'zh-TW': '$2', en: '$2' }, win: true, weight: 3, icon: '💰' },
  { id: 'c8', label: { 'zh-TW': '謝謝', en: 'Miss' }, win: false, weight: 4, icon: '🎰' },
];
