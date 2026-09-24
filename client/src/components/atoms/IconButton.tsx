import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'active';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variantClasses = {
  default: 'glass text-text',
  primary: 'bg-glass-action border border-glass-action-border text-text hover:bg-glass-action-hover hover:border-glass-border-hover',
  active: 'bg-accent-subtle border border-accent-border text-accent'
};

const sizeClasses = {
  sm: 'p-2',
  md: 'p-3'
};

const IconButton: React.FC<IconButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => (
  <button
    className={`rounded-full transition-base focus-ring flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
