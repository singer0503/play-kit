import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Confetti } from '../confetti';

function stubReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: reduce,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }),
  });
}

describe('Confetti', () => {
  afterEach(() => vi.restoreAllMocks());

  it('預設渲染 60 片', () => {
    stubReducedMotion(false);
    const { container } = render(<Confetti />);
    expect(container.querySelectorAll('.pk-confetti__piece')).toHaveLength(60);
  });

  it('可自訂 count 與 colors', () => {
    stubReducedMotion(false);
    const { container } = render(<Confetti count={5} colors={['red', 'blue']} />);
    expect(container.querySelectorAll('.pk-confetti__piece')).toHaveLength(5);
  });

  it('prefers-reduced-motion 時整個 component 不渲染', () => {
    stubReducedMotion(true);
    const { container } = render(<Confetti />);
    expect(container.querySelector('.pk-confetti')).toBeNull();
  });

  it('有 aria-hidden（純裝飾）', () => {
    stubReducedMotion(false);
    const { container } = render(<Confetti />);
    expect(container.querySelector('.pk-confetti')).toHaveAttribute('aria-hidden', 'true');
  });
});
