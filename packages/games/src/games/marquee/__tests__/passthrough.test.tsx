import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { Marquee } from '../Marquee';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('Marquee — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(false));

  it('className merge', () => {
    const { container } = render(<Marquee prizes={demoPrizes} className="custom-host" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-*', () => {
    const { container } = render(
      <Marquee
        prizes={demoPrizes}
        id="my-mq"
        style={{ maxWidth: 400 }}
        data-testid="mq-root"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-mq');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('mq-root');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / lang / dir', () => {
    const { container } = render(
      <Marquee prizes={demoPrizes} role="region" tabIndex={-1} lang="zh-TW" dir="ltr" />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('tabindex')).toBe('-1');
    expect(root?.getAttribute('lang')).toBe('zh-TW');
    expect(root?.getAttribute('dir')).toBe('ltr');
  });
});
