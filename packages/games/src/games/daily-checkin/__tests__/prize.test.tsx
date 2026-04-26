import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DailyCheckin } from '../DailyCheckin';
import type { DailyCheckinRef } from '../types';

const Wrapper = makeWrapper('en');

describe('DailyCheckin — reward determination', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('checkIn 累加 checked 標記當天', () => {
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10, 15]} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    const checked = ref.current?.getChecked();
    expect(checked?.[0]).toBe(true);
    expect(checked?.[1]).toBe(false);
  });

  it('onCheckIn 傳入正確的 day index + rewardPoints', () => {
    const onCheckIn = vi.fn();
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[5, 10, 15]} onCheckIn={onCheckIn} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.checkIn());
    expect(onCheckIn).toHaveBeenNthCalledWith(1, 0, 5);
    act(() => ref.current?.checkIn());
    expect(onCheckIn).toHaveBeenNthCalledWith(2, 1, 10);
  });

  it('最後一天完成時 onWin / onEnd 收到正確 total', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[10, 20]} onWin={onWin} onEnd={onEnd} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.checkIn());
    expect(onWin).toHaveBeenCalledWith(30);
    expect(onEnd).toHaveBeenCalledWith(30);
  });

  it('claim 傳入總分給 onClaim', () => {
    const onClaim = vi.fn();
    const ref = createRef<DailyCheckinRef>();
    render(<DailyCheckin ref={ref} rewards={[10, 20]} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.checkIn());
    act(() => ref.current?.checkIn());
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalledWith(30);
  });

  it('受控 checked 不觸發 onCheckedChange（外部已同步）', () => {
    const onCheckedChange = vi.fn();
    render(
      <DailyCheckin rewards={[5, 10]} checked={[true, false]} onCheckedChange={onCheckedChange} />,
      { wrapper: Wrapper },
    );
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
