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
  const errorClasses = error ? 'border-red-500' : 'border-border';
  
  return (
    <div className="w-full">
      <input
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;