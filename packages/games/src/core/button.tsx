import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 鍵盤與原生送出行為預設為 button；有表單提交需求才傳 'submit' */
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  children?: ReactNode;
}

/**
 * 共用 Button：應用 pk-btn + variant class。
 * 所有 game CTA 統一走這個元件，便於主題切換 / ref 掛載 / a11y。
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', className, children, ...rest },
  ref,
) {
  const classes = cx(
    'pk-btn',
    variant === 'primary' ? 'pk-btn--primary' : 'pk-btn--ghost',
    size === 'sm' && 'pk-btn--sm',
    className,
  );
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});
