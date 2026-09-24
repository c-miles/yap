import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'active' | 'off' | 'danger';
  children: React.ReactNode;
}

const variantClasses = {
  default: 'glass text-text',
  primary: 'bg-glass-action border border-glass-action-border text-text hover:bg-glass-action-hover hover:border-glass-border-hover',
  active: 'bg-accent-subtle border border-accent-border text-accent',
  off: 'bg-danger border border-danger text-danger-fg hover:brightness-110',
  danger: 'glass text-danger hover:bg-danger hover:border-danger hover:text-danger-fg',
};

const IconButton: React.FC<IconButtonProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    className={`w-12 h-12 shrink-0 rounded-full transition-base focus-ring flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
