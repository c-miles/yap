import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2;
}

const SIZE = { 1: "text-3xl", 2: "text-xl" } as const;

const Heading: React.FC<HeadingProps> = ({ level = 2, className = "", children, ...props }) => {
  const Tag = `h${level}` as const;
  return (
    <Tag className={`font-[650] [font-stretch:104%] tracking-[-0.01em] text-text ${SIZE[level]} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export default Heading;
