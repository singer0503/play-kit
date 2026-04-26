import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { LottoRoll } from '../LottoRoll';

const Wrapper = makeWrapper('en');

describe('LottoRoll — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge', () => {
    const { container } = render(<LottoRoll pickCount={3} className="custom-host" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-*', () => {
    const { container } = render(
      <LottoRoll
        pickCount={3}
        id="my-lr"
        style={{ maxWidth: 400 }}
        data-testid="lr-root"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-lr');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('lr-root');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir', () => {
    const { container } = render(
      <LottoRoll pickCount={3} role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
