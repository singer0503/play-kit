import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { FlipMatch } from '../FlipMatch';

const Wrapper = makeWrapper('en');

describe('FlipMatch — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge，不取代內建 class', () => {
    const { container } = render(<FlipMatch className="custom-host" />, { wrapper: Wrapper });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('pk-fm')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-* 透傳到根 section', () => {
    const { container } = render(
      <FlipMatch
        id="my-fm"
        style={{ maxWidth: 400 }}
        data-testid="fm-root"
        data-analytics="fm-1"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-fm');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('fm-root');
    expect(root?.getAttribute('data-analytics')).toBe('fm-1');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir 透傳', () => {
    const { container } = render(<FlipMatch role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
