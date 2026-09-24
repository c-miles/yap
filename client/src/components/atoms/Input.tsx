import React from 'react';

export const fieldClassName =
  'w-full min-h-11 px-4 bg-field text-text border rounded-lg placeholder:text-text-muted transition-base focus:outline-none focus:ring-2 focus:ring-accent';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ className = '', error, ...props }) => {
  const errorId = React.useId();

  return (
    <div className="w-full">
      <input
        className={`${fieldClassName} ${error ? 'border-danger' : 'border-glass-border'} ${className}`}
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
