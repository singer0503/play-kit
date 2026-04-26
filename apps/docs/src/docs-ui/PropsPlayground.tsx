import { Fragment, useMemo, useState } from 'react';
import { useDocsStrings } from '../i18n';
import type { GameMeta } from '../registry';

type KnobValue = number | boolean | string;
type Knob = NonNullable<GameMeta['knobs']>[number];

export interface PropsPlaygroundProps {
  render: GameMeta['render'];
  seedProps: GameMeta['seedProps'];
  knobs: NonNullable<GameMeta['knobs']>;
  /** 強制 demo 重新 mount 的 key */
  resetKey?: number;
}

interface KnobInputProps {
  id: string;
  knob: Knob;
  value: KnobValue | undefined;
  onChange: (next: KnobValue) => void;
}

function KnobInput({ id, knob, value, onChange }: KnobInputProps) {
  if (knob.type === 'number') {
    return (
      <input
        id={id}
        type="range"
        min={knob.min ?? 0}
        max={knob.max ?? 100}
        step={knob.step ?? 1}
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }
  if (knob.type === 'boolean') {
    return (
      <input
        id={id}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PropsPlayground({ render, seedProps, knobs, resetKey = 0 }: PropsPlaygroundProps) {
  const s = useDocsStrings();

  // 初始值：優先 knob.default，次取 seedProps[name]
  const [values, setValues] = useState<Record<string, KnobValue>>(() => {
    const init: Record<string, KnobValue> = {};
    for (const k of knobs) {
      const seed = (k.default ?? seedProps[k.prop]) as KnobValue | undefined;
      if (seed !== undefined) init[k.prop] = seed;
    }
    return init;
  });

  const merged = useMemo(() => ({ ...values }), [values]);

  return (
    <section className="docs-playground" aria-label={s.labels.playground}>
      <h3 className="docs-h3">{s.labels.playground}</h3>
      <div className="docs-playground__body">
        <aside className="docs-playground__knobs">
          {knobs.map((k) => {
            const id = `docs-knob-${k.prop}`;
            return (
              <label key={k.prop} htmlFor={id} className="docs-knob">
                <span className="docs-knob__label">
                  <code>{k.label ?? k.prop}</code>
                  <em>{String(values[k.prop] ?? '—')}</em>
                </span>
                <KnobInput
                  id={id}
                  knob={k}
                  value={values[k.prop]}
                  onChange={(next) => setValues((prev) => ({ ...prev, [k.prop]: next }))}
                />
              </label>
            );
          })}
        </aside>
        <div className="docs-playground__stage">
          <Fragment key={resetKey}>{render(merged)}</Fragment>
        </div>
      </div>
    </section>
  );
}
