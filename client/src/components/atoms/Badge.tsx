import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "accent" | "danger" | "neutral";
  size?: "sm" | "md";
}

const VARIANT = {
  accent: "bg-accent text-accent-fg",
  danger: "bg-danger text-accent-fg",
  neutral: "bg-surface-raised text-text",
} as const;

const SIZE = { sm: "text-xs px-2 py-0.5", md: "text-sm px-2.5 py-1" } as const;

const Badge: React.FC<BadgeProps> = ({ variant = "accent", size = "sm", className = "", children, ...props }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full font-medium ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
