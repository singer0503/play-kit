import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControlled } from '../use-controlled';

describe('useControlled', () => {
  it('uncontrolled：起始為 default，set 更新內部 state', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControlled<number>({ controlled: undefined, default: 0, onChange }),
    );
    expect(result.current[0]).toBe(0);

    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('controlled：以外部值為準，set 不改變輸出值但 fire onChange', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ ctrl }: { ctrl: number }) =>
        useControlled<number>({ controlled: ctrl, default: 0, onChange }),
      { initialProps: { ctrl: 10 } },
    );
    expect(result.current[0]).toBe(10);

    act(() => result.current[1](99));
    expect(onChange).toHaveBeenCalledWith(99);
    expect(result.current[0]).toBe(10); // 仍受外部控制

    rerender({ ctrl: 42 });
    expect(result.current[0]).toBe(42);
  });

  it('支援 updater function', () => {
    const { result } = renderHook(() =>
      useControlled<number>({ controlled: undefined, default: 10 }),
    );
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(11);
  });

  it('onChange 改變不會觸發 stale closure', () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (n: number) => void }) =>
        useControlled<number>({ controlled: undefined, default: 0, onChange: cb }),
      { initialProps: { cb: onChangeA } },
    );
    rerender({ cb: onChangeB });
    act(() => result.current[1](1));
    expect(onChangeA).not.toHaveBeenCalled();
    expect(onChangeB).toHaveBeenCalledWith(1);
  });
});
