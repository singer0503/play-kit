import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LuckyWheel } from '../LuckyWheel';
import { demoPrizes, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

// 代表性 passthrough 驗證：所有 game 共享 BaseGameProps → 驗一次即可
describe('LuckyWheel — HTML passthrough（代表所有 game）', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge，不取代內建 class', () => {
    const { container } = render(<LuckyWheel prizes={demoPrizes} className="custom-host" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('pk-lw')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-* 透傳到根 section', () => {
    const { container } = render(
      <LuckyWheel
        prizes={demoPrizes}
        id="my-wheel"
        style={{ maxWidth: 400 }}
        data-testid="lw-root"
        data-analytics="spin-1"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-wheel');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('lw-root');
    expect(root?.getAttribute('data-analytics')).toBe('spin-1');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / hidden / lang / dir 透傳（React HTMLAttributes 借用驗證）', () => {
    const { container } = render(
      <LuckyWheel
        prizes={demoPrizes}
        role="region"
        tabIndex={-1}
        hidden={false}
        lang="zh-TW"
        dir="ltr"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
