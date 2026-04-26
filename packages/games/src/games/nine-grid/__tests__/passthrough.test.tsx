import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { NineGrid } from '../NineGrid';
import { demoCells, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('NineGrid — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge，不取代內建 class', () => {
    const { container } = render(<NineGrid cells={demoCells} className="custom-host" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('pk-ng')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-*', () => {
    const { container } = render(
      <NineGrid
        cells={demoCells}
        id="my-ng"
        style={{ maxWidth: 400 }}
        data-testid="ng-root"
        data-analytics="ng-1"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-ng');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('ng-root');
    expect(root?.getAttribute('data-analytics')).toBe('ng-1');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir 透傳', () => {
    const { container } = render(
      <NineGrid cells={demoCells} role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
