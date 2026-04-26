import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWrapper, stubMatchMedia } from '../../../test-utils';
import { DollMachine } from '../DollMachine';
import type { DollMachineRef } from '../types';
import { demoPrizes } from './test-utils';

const Wrapper = makeWrapper('en');

describe('DollMachine — outcome callbacks', () => {
  beforeEach(() => stubMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it('onWin / onEnd(won=true) 帶正確 prize', () => {
    const onWin = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<DollMachineRef>();
    render(
      <DollMachine
        ref={ref}
        prizes={demoPrizes}
        forcedOutcome={true}
        forcedPrizeIndex={1}
        onWin={onWin}
        onEnd={onEnd}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.tryGrab());
    expect(onWin).toHaveBeenCalledWith(demoPrizes[1]);
    expect(onEnd.mock.calls[0]?.[1]).toBe(true);
  });

  it('onLose + onEnd(prize=null, won=false)', () => {
    const onLose = vi.fn();
    const onEnd = vi.fn();
    const ref = createRef<DollMachineRef>();
    render(
      <DollMachine
        ref={ref}
        prizes={demoPrizes}
        forcedOutcome={false}
        onLose={onLose}
        onEnd={onEnd}
      />,
      { wrapper: Wrapper },
    );
    act(() => ref.current?.tryGrab());
    expect(onLose).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(null, false);
  });

  it('onClaim 帶 prize', () => {
    const onClaim = vi.fn();
    const ref = createRef<DollMachineRef>();
    render(<DollMachine ref={ref} prizes={demoPrizes} forcedOutcome={true} onClaim={onClaim} />, {
      wrapper: Wrapper,
    });
    act(() => ref.current?.tryGrab());
    act(() => ref.current?.claim());
    expect(onClaim).toHaveBeenCalled();
  });
});
