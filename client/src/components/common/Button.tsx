import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface CommonProps {
  variant?: Variant;
  size?: 'default' | 'small';
  children: ReactNode;
  className?: string;
}

interface AsButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  as?: 'button';
}

interface AsLinkProps extends CommonProps {
  as: 'link';
  to: string;
}

type ButtonProps = AsButtonProps | AsLinkProps;

function buildClassName(variant: Variant, size: 'default' | 'small', extra?: string): string {
  return [styles.btn, styles[variant], size === 'small' ? styles.small : '', extra]
    .filter(Boolean)
    .join(' ');
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'default', children, className } = props;
  const classNames = buildClassName(variant, size, className);

  if (props.as === 'link') {
    const { to } = props;
    return (
      <Link to={to} className={classNames}>
        {children}
      </Link>
    );
  }

  const { as: _as, variant: _v, size: _s, children: _c, className: _cl, ...buttonProps } = props as AsButtonProps;
  return (
    <button type="button" {...buttonProps} className={classNames}>
      {children}
    </button>
  );
}
