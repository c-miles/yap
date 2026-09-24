import React from "react";

const SIZE = { sm: "text-2xl", lg: "text-[clamp(3.75rem,8vw,5.5rem)]" } as const;

const Wordmark: React.FC<{ size?: keyof typeof SIZE; className?: string }> = ({ size = "sm", className = "" }) => (
  <span className={`font-display font-semibold tracking-[-0.04em] leading-none text-text ${SIZE[size]} ${className}`}>
    yap
  </span>
);

export default Wordmark;
