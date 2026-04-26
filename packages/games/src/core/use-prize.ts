// 依 weight 權重從獎品池抽一個 index。
// - weight 預設 1；0 或負值視為 0（不會被抽中）
// - 全 0 時回傳 -1（呼叫者自行處理 fallback）
export function pickPrize<T extends { weight?: number | undefined }>(prizes: readonly T[]): number {
  const weights = prizes.map((p) => Math.max(0, p.weight ?? 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return -1;
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return i;
  }
  /* v8 ignore next 2 — 僅於浮點邊界 roll === total 時可達（Math.random() < 1 保證幾乎不會） */
  return weights.length - 1;
}
