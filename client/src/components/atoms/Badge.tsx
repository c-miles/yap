import React from "react";

const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = "", children, ...props }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-medium text-xs px-2 py-0.5 bg-accent text-accent-fg ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
