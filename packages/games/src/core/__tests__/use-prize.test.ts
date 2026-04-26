import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickPrize } from '../use-prize';

describe('pickPrize', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('等權時大致均勻分佈（1000 次抽樣 ±10%）', () => {
    const prizes = [{ weight: 1 }, { weight: 1 }, { weight: 1 }, { weight: 1 }];
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const idx = pickPrize(prizes);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    // 每格預期 1000，允許 ±150 偏差
    for (const c of counts) {
      expect(c).toBeGreaterThan(850);
      expect(c).toBeLessThan(1150);
    }
  });

  it('weight 0 永遠不被抽中', () => {
    const prizes = [{ weight: 0 }, { weight: 1 }];
    for (let i = 0; i < 200; i++) expect(pickPrize(prizes)).toBe(1);
  });

  it('全 0 回傳 -1', () => {
    expect(pickPrize([{ weight: 0 }, { weight: 0 }])).toBe(-1);
  });

  it('undefined weight 預設為 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // 落在第一格
    expect(pickPrize([{}, {}])).toBe(0);
  });

  it('權重極偏時命中比例明顯', () => {
    const prizes = [{ weight: 1 }, { weight: 99 }];
    let aCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (pickPrize(prizes) === 0) aCount++;
    }
    // 預期 A 約 10 次，允許 0–30
    expect(aCount).toBeLessThan(30);
  });
});
