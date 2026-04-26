import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DollMachine } from '../DollMachine';
import type { DollMachineRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('DollMachine — ref API', () => {
  beforeEach(() => {
    stubMatchMedia(true);
    vi.useRealTimers();
  });
  afterEach(() => vi.restoreAllMocks());

  it('ref 暴露 tryGrab / reset / claim / getState / getRemaining', () => {
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} />, { wrapper: Wrapper });
    expect(typeof ref.current?.tryGrab).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.claim).toBe('function');
    expect(typeof ref.current?.getState).toBe('function');
    expect(typeof ref.current?.getRemaining).toBe('function');
  });

  it('getRemaining 在成功後遞減', () => {
    const ref = createRef<DollMachineRef>();
    render(
      <DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} defaultRemaining={3} />,
      { wrapper: Wrapper },
    );
    expect(ref.current?.getRemaining()).toBe(3);
    act(() => ref.current?.tryGrab());
    expect(ref.current?.getRemaining()).toBe(2);
  });

  it('claim 在非 won state 時 no-op', () => {
    const onClaim = vi.fn();
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} onClaim={onClaim} />, { wrapper: Wrapper });
    act(() => ref.current?.claim());
    expect(onClaim).not.toHaveBeenCalled();
  });
});
