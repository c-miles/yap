import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-glass-action border border-glass-action-border backdrop-blur-sm text-text hover:bg-glass-action-hover hover:border-glass-border-hover',
  secondary: 'glass text-text',
  ghost: 'border border-transparent text-text-secondary hover:text-text hover:bg-glass-hover',
  danger: 'glass text-danger hover:bg-danger hover:border-danger hover:text-danger-fg'
};

const sizeClasses = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-6 text-lg'
};

export const buttonClassName = (variant: Variant = 'primary', size: Size = 'md', className = '') =>
  `inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-base focus-ring disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

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
