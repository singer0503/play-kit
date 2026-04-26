import { render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useGameScale } from '../use-game-scale';

/**
 * MockResizeObserver — 攔截 hook 內 new ResizeObserver(cb)，
 * 透過 `instances.last().trigger(width)` 手動驅動 entry，
 * 以驗證 hook 對 width 變化的反應（jsdom 不算 layout，無法用 real RO）。
 */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  cb: ResizeObserverCallback;
  observed: Element | null = null;
  disconnected = false;

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed = el;
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
    this.observed = null;
  }
  trigger(width: number) {
    if (!this.observed) return;
    this.cb(
      [{ contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  static last(): MockResizeObserver | undefined {
    return MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
  }
}

let originalRO: typeof globalThis.ResizeObserver | undefined;

beforeEach(() => {
  MockResizeObserver.instances = [];
  originalRO = globalThis.ResizeObserver;
  (globalThis as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  if (originalRO) {
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = originalRO;
  }
});

function TestComp({
  designWidth = 340,
  enabled = true,
}: {
  designWidth?: number;
  enabled?: boolean;
}) {
  const ref = useGameScale<HTMLElement>(designWidth, { enabled });
  return <section ref={ref} data-testid="root" />;
}

describe('useGameScale', () => {
  it('mount 後註冊 ResizeObserver 並觀察元素', () => {
    render(<TestComp />);
    const ro = MockResizeObserver.last();
    expect(ro).toBeDefined();
    expect(ro?.observed).toBeInstanceOf(HTMLElement);
  });

  it('container 寬度 < designWidth → --pk-scale = ratio', () => {
    const { getByTestId } = render(<TestComp designWidth={400} />);
    const el = getByTestId('root');
    const ro = MockResizeObserver.last();
    expect(ro).toBeDefined();
    if (!ro) return;

    act(() => {
      ro.trigger(200);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('0.5');
  });

  it('container 寬度 >= designWidth → scale cap 在 1（不放大）', () => {
    const { getByTestId } = render(<TestComp designWidth={300} />);
    const el = getByTestId('root');
    const ro = MockResizeObserver.last();
    if (!ro) return;

    act(() => {
      ro.trigger(800);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('1');
  });

  it('多次 resize 反覆更新 --pk-scale', () => {
    const { getByTestId } = render(<TestComp designWidth={400} />);
    const el = getByTestId('root');
    const ro = MockResizeObserver.last();
    if (!ro) return;

    act(() => {
      ro.trigger(200);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('0.5');

    act(() => {
      ro.trigger(300);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('0.75');

    act(() => {
      ro.trigger(500);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('1');
  });

  it('width 為 0（element 還沒 layout）→ scale = 1，不寫 NaN', () => {
    const { getByTestId } = render(<TestComp designWidth={340} />);
    const el = getByTestId('root');
    const ro = MockResizeObserver.last();
    if (!ro) return;

    act(() => {
      ro.trigger(0);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('1');
  });

  it('enabled=false：不創 ResizeObserver、不寫 --pk-scale', () => {
    const { getByTestId } = render(<TestComp enabled={false} />);
    const el = getByTestId('root');
    expect(MockResizeObserver.instances).toHaveLength(0);
    expect(el.style.getPropertyValue('--pk-scale')).toBe('');
  });

  it('enabled true → false 切換：disconnect 舊 observer、清掉 --pk-scale', () => {
    const { rerender, getByTestId } = render(<TestComp enabled />);
    const el = getByTestId('root');
    const firstRo = MockResizeObserver.last();
    if (!firstRo) return;

    act(() => {
      firstRo.trigger(170);
    });
    expect(el.style.getPropertyValue('--pk-scale')).toBe('0.5');

    rerender(<TestComp enabled={false} />);
    expect(firstRo.disconnected).toBe(true);
    expect(el.style.getPropertyValue('--pk-scale')).toBe('');
  });

  it('unmount → disconnect observer', () => {
    const { unmount } = render(<TestComp />);
    const ro = MockResizeObserver.last();
    if (!ro) return;
    expect(ro.disconnected).toBe(false);

    unmount();
    expect(ro.disconnected).toBe(true);
  });

  it('ResizeObserver 不存在的環境（極老瀏覽器）：mount 不爆', () => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = undefined;
    expect(() => render(<TestComp />)).not.toThrow();
  });

  it('designWidth 改變：deps 觸發 effect re-run（重新觀察）', () => {
    const { rerender } = render(<TestComp designWidth={300} />);
    const firstRo = MockResizeObserver.last();
    if (!firstRo) return;

    rerender(<TestComp designWidth={400} />);
    const secondRo = MockResizeObserver.last();

    // 新 RO 創出來、舊 RO 被 disconnect
    expect(secondRo).not.toBe(firstRo);
    expect(firstRo.disconnected).toBe(true);
  });
});
