import { useCallback, useRef, useState } from 'react';

// 受控 / 非受控雙模 state hook。NutUI 同款。
// - 若 `controlled` 有傳值，以外部為準（uncontrolled internal 仍保留但不影響輸出）
// - 若 `controlled` 為 undefined，用 internal state，onChange 同時 fire
// 使用者應避免在 controlled / uncontrolled 之間切換（會觸發 React warning）。
export function useControlled<T>(options: {
  controlled: T | undefined;
  default: T;
  onChange?: ((value: T) => void) | undefined;
}): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const { controlled, default: defaultValue, onChange } = options;
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = (isControlled ? controlled : internal) as T;

  // 保持最新 handler，避免 stale closure
  const latestValueRef = useRef(value);
  latestValueRef.current = value;
  const latestOnChangeRef = useRef(onChange);
  latestOnChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(latestValueRef.current) : next;
      if (!isControlled) setInternal(resolved);
      latestOnChangeRef.current?.(resolved);
    },
    [isControlled],
  );

  return [value, setValue] as const;
}
