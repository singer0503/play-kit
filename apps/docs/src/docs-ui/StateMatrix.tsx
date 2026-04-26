import { type GameState, PlayKitProvider } from '@play-kit/games';
import { useDocsStrings } from '../i18n';
import type { GameMeta } from '../registry';

const STATES: readonly GameState[] = ['idle', 'playing', 'won', 'lost', 'claimed', 'cooldown'];

export interface StateMatrixProps {
  render: GameMeta['render'];
  /** 點擊某格時通知父層（例：切換主 demo 到該 state） */
  onSelect?: (state: GameState) => void;
}

// 以受控 `state` prop 為每個 state 渲染一份縮圖。
// 使用者可點格切主預覽，亦可單獨觀察 state 差異。
//
// 注意：tile 用 `transform: scale(0.4)` 做 thumbnail，game 內部不能再 auto-scale，
// 否則 content-sized parent 會與 useGameScale 形成 spiral feedback（無限縮小）。
// 用 <PlayKitProvider scale="off"> 包住每個 tile 渲染、game 維持設計尺寸，
// 縮放完全交給 .docs-matrix__scale 的 transform 處理。
export function StateMatrix({ render, onSelect }: StateMatrixProps) {
  const s = useDocsStrings();
  return (
    <section className="docs-matrix" aria-label={s.labels.stateMatrix}>
      <h3 className="docs-h3">{s.labels.stateMatrix}</h3>
      <div className="docs-matrix__grid">
        {STATES.map((st) => (
          <button
            type="button"
            key={st}
            className="docs-matrix__cell"
            onClick={() => onSelect?.(st)}
            aria-label={`${s.labels.stateMatrix}: ${st}`}
          >
            <div className="docs-matrix__stage">
              <div className="docs-matrix__scale">
                <PlayKitProvider scale="off">{render({ state: st })}</PlayKitProvider>
              </div>
            </div>
            <div className="docs-matrix__label">{st}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
