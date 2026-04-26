import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { RingToss } from '../RingToss';
import type { RingTossRef } from '../types';

const Wrapper = makeWrapper('en');

describe('RingToss — outcome callbacks', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('onToss(pos, hit=true) 在命中時觸發', () => {
    const onToss = vi.fn();
    const ref = createRef<RingTossRef>();
    render(
      <RingToss ref={ref} pegX={10} tolerance={5} attempts={1} hitsToWin={1} onToss={onToss} />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(onToss).toHaveBeenCalledWith(expect.any(Number), true);
  });

  it('onToss hit=false 在偏離時', () => {
    const onToss = vi.fn();
    const ref = createRef<RingTossRef>();
    render(<RingToss ref={ref} pegX={90} tolerance={2} attempts={1} onToss={onToss} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(onToss).toHaveBeenCalledWith(expect.any(Number), false);
  });

  it('onWin(hits) + onEnd(hits, true)', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<RingTossRef>();
    render(
      <RingToss
        ref={ref}
        pegX={10}
        tolerance={5}
        attempts={1}
        hitsToWin={1}
        onWin={onWin}
        onEnd={onEnd}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(onWin).toHaveBeenCalledWith(1);
    expect(onEnd).toHaveBeenCalledWith(1, true);
  });

  it('onLose(hits) + onEnd(hits, false)', () => {
    const onLose = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<RingTossRef>();
    render(
      <RingToss ref={ref} pegX={90} tolerance={2} attempts={1} onLose={onLose} onEnd={onEnd} />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.start());
    act(() => ref.current?.toss());
    expect(onLose).toHaveBeenCalledWith(0);
    expect(onEnd).toHaveBeenCalledWith(0, false);
  });
});
