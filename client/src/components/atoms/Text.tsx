import React from "react";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "body" | "secondary" | "muted";
}

const VARIANT = {
  body: "text-text",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
} as const;

const Text: React.FC<TextProps> = ({ variant = "body", className = "", children, ...props }) => (
  <p className={`${VARIANT[variant]} ${className}`} {...props}>
    {children}
  </p>
);

export default Text;
