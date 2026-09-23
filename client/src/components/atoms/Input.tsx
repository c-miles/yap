import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ 
  className = '',
  error,
  ...props 
}) => {
  const baseClasses = 'w-full px-4 py-2 bg-surface text-text border rounded-md transition-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 focus:border-transparent';
  const errorClasses = error ? 'border-danger' : 'border-border';
  const errorId = React.useId();

  return (
    <div className="w-full">
      <input
        className={`${baseClasses} ${errorClasses} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
};

export default Input;