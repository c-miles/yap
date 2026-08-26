import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const PADDING = { sm: "p-4", md: "p-6", lg: "p-8" } as const;

const Card: React.FC<CardProps> = ({ padding = "md", className = "", children, ...props }) => (
  <div className={`bg-surface border border-border rounded-lg ${PADDING[padding]} ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
