import type { LocalizableText } from './i18n-utils';

// 全部 game 共用的六態狀態機。
// 刻意不泛型化：library 17 款 game 共享同一 state 介面是核心契約
// （StateBadge / StateMatrix / canTransition / isTerminal 皆依賴 uniform union）。
export type GameState = 'idle' | 'playing' | 'won' | 'lost' | 'claimed' | 'cooldown';

// 最小獎品形狀；各 game 可 extend。
export interface Prize {
  /** 穩定 id；**強烈建議**提供以避免 React key 衝突（尤其 label 可能重複時）。
   *  未提供時 game 內部 fallback 到 array index，在 fixed-length 佈局（egg / box / cell）安全。 */
  id?: string;
  /** 獎品顯示文字；可為 string 或 `{ locale: string }` 多語 map（支援任意 locale）。 */
  label: LocalizableText;
  /** 是否算「獲勝」—— 影響 `GameState` 是否轉到 `'won'`。
   *  注意：此欄位與 `weight` 語意**正交**（見下）。 */
  win: boolean;
  /** 抽中權重，預設 1。設為 0 代表**永遠不會被抽中**（即使 `win: true`）。
   *  權重是「機率」、`win` 是「結果性質」，兩者不互相蘊含。
   *  例：`{ win: false, weight: 10 }` 是「會抽中的謝謝光臨」。 */
  weight?: number;
}

// 所有 game component 共用的 controlled / uncontrolled state props。
export interface ControlledStateProps {
  /** 受控：外部持有 state */
  state?: GameState;
  /** 非受控：初始 state，預設 'idle' */
  defaultState?: GameState;
  /** state 每次轉換會 fire（受控 + 非受控皆 fire） */
  onStateChange?: (state: GameState) => void;
}

/**
 * HTML passthrough：直接 Pick React 既有的 `HTMLAttributes`，省下自己維護
 * `className / id / style / role / tabIndex`，且 React 升級時自動跟進。
 * 刻意**不**繼承 `onClick` / `onKeyDown` 等事件，避免與 game 內部事件邏輯衝撞
 * （consumer 要外掛事件請用外層 wrapper）。
 */
type GamePassthroughProps = Pick<
  React.HTMLAttributes<HTMLElement>,
  'className' | 'id' | 'style' | 'role' | 'tabIndex' | 'hidden' | 'lang' | 'dir'
> &
  React.AriaAttributes & {
    /** 任意 `data-*` 透傳（如 `data-testid`） */
    [k: `data-${string}`]: string | number | boolean | undefined;
  };

/**
 * 所有 game component 的共用 props。
 * - controlled state 對（`state` / `defaultState` / `onStateChange`）
 * - HTML passthrough（className / id / style / role / tabIndex / aria-* / data-*）
 */
export interface BaseGameProps extends ControlledStateProps, GamePassthroughProps {}
