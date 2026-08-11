import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '',
  children,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-md transition-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-opacity-75';

  const variantClasses = {
    primary: 'bg-accent hover:bg-accent-hover text-accent-fg',
    secondary: 'bg-surface hover:bg-surface-raised text-text border border-border',
    ghost: 'bg-transparent hover:bg-surface text-text',
    danger: 'bg-danger hover:bg-danger text-text'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;