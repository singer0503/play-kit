import { type MutableRefObject, useEffect, useRef } from 'react';

/**
 * 把任意 value 鏡射到一個 ref，每次 render 後同步更新。
 *
 * 用途：在 `setTimeout` / `setInterval` / rAF / event listener 等時機
 * 讀取「最新」的 React state，避免 closure 綁在建立時的舊 snapshot。
 *
 * 典型使用：當 component 是 controlled 時，外部 parent 可能在動畫中途
 * 把 `state` 從 `'playing'` 切成 `'idle'`。遊戲內建的 `setTimeout(finalize, ...)`
 * 原本 closure 不知情，時器到點仍呼 `setState('won')` 造成邏輯錯亂。
 * 透過 `stateRef = useLatestRef(state)`，timer 進入點檢查 `stateRef.current`
 * 就能即時早退。
 *
 * 回傳型別刻意為 `MutableRefObject<T>`（同 `useRef` 本體），
 * 如此 Biome / ESLint 的 hook-deps 規則會自動視為穩定值，不再誤報。
 */
export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    // 故意不加 deps array：每次 render 後都同步一次 ref.current = value。
    // 若改成 [value] 行為等價（仍每次 value 變才寫入）但語意較不直觀；
    // 若改成 [] 則 ref 永遠停在第一次 render 的 value，徹底壞掉本 hook 用途。
    ref.current = value;
  });
  return ref;
}
