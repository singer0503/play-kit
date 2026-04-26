import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DailyCheckin } from '../DailyCheckin';

const Wrapper = makeWrapper('en');

describe('DailyCheckin — HTML passthrough', () => {
  beforeEach(() => stubMatchMedia(true));

  it('className merge，不取代內建 class', () => {
    const { container } = render(<DailyCheckin rewards={[5, 10]} className="custom-host" />, {
      wrapper: Wrapper,
    });
    const root = container.querySelector('section');
    expect(root?.classList.contains('pk-game')).toBe(true);
    expect(root?.classList.contains('pk-dc')).toBe(true);
    expect(root?.classList.contains('custom-host')).toBe(true);
  });

  it('id / style / data-* / aria-* 透傳到根 section', () => {
    const { container } = render(
      <DailyCheckin
        rewards={[5, 10]}
        id="my-dc"
        style={{ maxWidth: 400 }}
        data-testid="dc-root"
        data-analytics="dc-1"
        aria-describedby="hint"
      />,
      { wrapper: Wrapper },
    );
    const root = container.querySelector('section');
    expect(root?.id).toBe('my-dc');
    expect(root?.getAttribute('style')).toMatch(/max-width:\s*400px/);
    expect(root?.getAttribute('data-testid')).toBe('dc-root');
    expect(root?.getAttribute('data-analytics')).toBe('dc-1');
    expect(root?.getAttribute('aria-describedby')).toBe('hint');
  });

  it('role / tabIndex / hidden / lang / dir 透傳', () => {
    const { container } = render(
      <DailyCheckin
        rewards={[5, 10]}
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
