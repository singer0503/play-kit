import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { GiftRain } from '../GiftRain';

const Wrapper = makeWrapper('en');

describe('GiftRain — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge', () => {
    const { container } = render(<GiftRain className="custom-host" />, { wrapper: Wrapper });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-*', () => {
    const { container } = render(
      <GiftRain
        id="my-gr"
        style={{ maxWidth: 400 }}
        data-testid="gr-root"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-gr');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('gr-root');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir', () => {
    const { container } = render(<GiftRain role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
