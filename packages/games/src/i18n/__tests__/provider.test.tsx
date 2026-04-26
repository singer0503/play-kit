import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayKitProvider, useI18n } from '../provider';

describe('PlayKitProvider + useI18n', () => {
  it('預設 lang 為 zh-TW', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <PlayKitProvider>{children}</PlayKitProvider>,
    });
    expect(result.current.lang).toBe('zh-TW');
  });

  it('t() 查 dict 並回字串', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <PlayKitProvider lang="en">{children}</PlayKitProvider>,
    });
    expect(result.current.t('state.won')).toBe('Won');
  });

  it('t() 支援 {param} 插值', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <PlayKitProvider lang="en">{children}</PlayKitProvider>,
    });
    expect(result.current.t('luckyWheel.announceWon', { prize: '$100' })).toBe('You won $100');
  });

  it('key 不存在時退回 en，再退回 key 本身', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <PlayKitProvider lang="zh-TW">{children}</PlayKitProvider>,
    });
    expect(result.current.t('does.not.exist')).toBe('does.not.exist');
  });

  it('未包 provider 時，useI18n 仍回英文 fallback（不 throw）', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.lang).toBe('en');
    expect(result.current.t('state.idle')).toBe('Idle');
  });

  it('fallback 也支援 {param} 插值與 key-miss fallthrough', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t('luckyWheel.announceWon', { prize: '$10' })).toBe('You won $10');
    expect(result.current.t('does.not.exist')).toBe('does.not.exist');
    // 缺 param 時保留 placeholder
    expect(result.current.t('luckyWheel.announceWon')).toBe('You won {prize}');
  });

  it('children render 正確受 lang 影響', () => {
    function Demo() {
      const { t } = useI18n();
      return <span>{t('action.spin')}</span>;
    }
    render(
      <PlayKitProvider lang="zh-TW">
        <Demo />
      </PlayKitProvider>,
    );
    expect(screen.getByText('抽獎')).toBeInTheDocument();
  });

  it('傳 theme 時輸出 wrapper div 並設 data-theme', () => {
    const { container } = render(
      <PlayKitProvider theme="neon" data-testid="pk-root">
        <span>inside</span>
      </PlayKitProvider>,
    );
    const root = container.querySelector('[data-testid="pk-root"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('data-theme')).toBe('neon');
    expect(root?.classList.contains('pk-root')).toBe(true);
  });

  it('未傳 theme 時不多包 div，children 直接作為 provider 唯一 output', () => {
    const { container } = render(
      <PlayKitProvider>
        <span data-testid="inside">x</span>
      </PlayKitProvider>,
    );
    // 未 wrap：inside span 是 container 的直屬 child
    expect(container.firstChild).toBe(container.querySelector('[data-testid="inside"]'));
  });

  it('wrap=true 強制 wrap，可透傳 className / data-*', () => {
    const { container } = render(
      <PlayKitProvider wrap className="custom" data-analytics="play-kit">
        <span>x</span>
      </PlayKitProvider>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.classList.contains('pk-root')).toBe(true);
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.getAttribute('data-analytics')).toBe('play-kit');
  });
});
