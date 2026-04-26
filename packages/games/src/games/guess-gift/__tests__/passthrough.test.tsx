import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GuessGift } from '../GuessGift';

const Wrapper = makeWrapper('en');

describe('GuessGift — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(true));

  it('className merge', () => {
    const { container } = render(<GuessGift className="custom-host" />, { wrapper: Wrapper });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-*', () => {
    const { container } = render(
      <GuessGift
        id="my-gg"
        style={{ maxWidth: 400 }}
        data-testid="gg-root"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-gg');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('gg-root');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir', () => {
    const { container } = render(<GuessGift role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
