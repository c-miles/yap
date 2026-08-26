import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const LEVEL_SIZE = { 1: "text-4xl", 2: "text-2xl", 3: "text-xl", 4: "text-lg" } as const;
const SIZE = { sm: "text-lg", md: "text-xl", lg: "text-3xl", xl: "text-4xl", "2xl": "text-6xl" } as const;

const Heading: React.FC<HeadingProps> = ({ level = 2, size, className = "", children, ...props }) => {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  const sizeClass = size ? SIZE[size] : LEVEL_SIZE[level];
  return (
    <Tag className={`font-display font-semibold text-text ${sizeClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export default Heading;
