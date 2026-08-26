import React from "react";

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "body" | "secondary" | "muted" | "small";
  as?: "p" | "span" | "label";
}

const VARIANT = {
  body: "text-text",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
  small: "text-sm text-text-muted",
} as const;

const Text: React.FC<TextProps> = ({ variant = "body", as = "p", className = "", children, ...props }) => {
  const Tag = as;
  return (
    <Tag className={`${VARIANT[variant]} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export default Text;
