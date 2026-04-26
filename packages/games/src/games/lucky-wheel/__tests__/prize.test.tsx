import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LuckyWheel } from '../LuckyWheel';
import type { LuckyWheelRef } from '../types';
import { demoPrizes, makeWrapper, stubMatchMedia } from './test-utils';

const Wrapper = makeWrapper('en');

describe('LuckyWheel — prize determination', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('prizeIndex prop 明示時強制落該 index', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={2} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd.mock.calls[0]?.[1]).toBe(2);
  });

  it('ref.spin(index) 覆寫 prop prizeIndex', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.spin(5));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd.mock.calls[0]?.[1]).toBe(5);
  });

  it('index 超出上界會被 clamp 到最後一個', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.spin(999));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd.mock.calls[0]?.[1]).toBe(demoPrizes.length - 1);
  });

  it('onWin 只在 win=true 獎品時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(
      <LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={0} onWin={onWin} onLose={onLose} />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onLose).not.toHaveBeenCalled();
    expect(onWin.mock.calls[0]?.[0]?.id).toBe('p1');
  });

  it('onLose 只在 win=false 獎品時觸發', () => {
    const onWin = vi.fn();
    const onLose = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(
      <LuckyWheel ref={ref} prizes={demoPrizes} prizeIndex={1} onWin={onWin} onLose={onLose} />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(onWin).not.toHaveBeenCalled();
  });

  it('onEnd 每次 spin 完成都會 fire', () => {
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(
      <LuckyWheel
        ref={ref}
        prizes={demoPrizes}
        prizeIndex={1}
        onEnd={onEnd}
        defaultRemaining={2}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => ref.current?.reset());
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onEnd).toHaveBeenCalledTimes(2);
  });

  it('prizeIndex=-1 時走 weighted random（mock Math.random 驗證）', () => {
    // Math.random 固定落在第 2 格（weighted picker 會對應到某個 index）
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onEnd = vi.fn();
    const ref = createRef<LuckyWheelRef>();
    render(<LuckyWheel ref={ref} prizes={demoPrizes} onEnd={onEnd} />, { wrapper: Wrapper });
    act(() => ref.current?.spin());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Math.random=0 且第一個 weight=1 → 落第 0 格
    expect(onEnd.mock.calls[0]?.[1]).toBe(0);
  });
});
