import { describe, expect, it } from 'vitest';
import { resolveLocalized } from '../i18n-utils';

describe('resolveLocalized', () => {
  it('string 直接回傳', () => {
    expect(resolveLocalized('hello', 'en')).toBe('hello');
    expect(resolveLocalized('哈囉', 'zh-TW')).toBe('哈囉');
  });

  it('命中當前 lang', () => {
    expect(resolveLocalized({ 'zh-TW': '中文', en: 'English' }, 'zh-TW')).toBe('中文');
    expect(resolveLocalized({ 'zh-TW': '中文', en: 'English' }, 'en')).toBe('English');
  });

  it('找不到 lang 時 fallback 到 en', () => {
    expect(resolveLocalized({ 'zh-TW': '中文', en: 'English' }, 'ja')).toBe('English');
  });

  it('支援任意 locale key（不再硬編 zh-TW / en）', () => {
    const label = { ja: '日本語', 'zh-CN': '简体', fr: 'Français' };
    expect(resolveLocalized(label, 'ja')).toBe('日本語');
    expect(resolveLocalized(label, 'zh-CN')).toBe('简体');
    expect(resolveLocalized(label, 'fr')).toBe('Français');
  });

  it('都找不到時 fallback 到第一個非空值', () => {
    const label = { fr: 'Français' };
    // 未命中、也沒 en → 回任一值
    expect(resolveLocalized(label, 'de')).toBe('Français');
  });

  it('空物件回空字串（邊界）', () => {
    expect(resolveLocalized({}, 'en')).toBe('');
  });
});
