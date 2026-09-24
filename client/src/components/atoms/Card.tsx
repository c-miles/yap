import React from "react";

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...props }) => (
  <div className={`glass-panel rounded-xl p-8 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
