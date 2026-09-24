import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-accent hover:bg-accent-hover text-accent-fg',
  secondary: 'bg-surface hover:bg-surface-raised text-text border border-border',
  ghost: 'bg-transparent hover:bg-surface text-text',
  danger: 'bg-danger hover:brightness-110 text-accent-fg',
  glass: 'glass text-text'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export const buttonClassName = (variant: Variant = 'primary', size: Size = 'md', className = '') =>
  `inline-block font-medium rounded-md transition-base focus-ring ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => (
  <button className={buttonClassName(variant, size, className)} {...props}>
    {children}
  </button>
);

export default Button;
