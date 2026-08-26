import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import Icon from "./Icon";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const BOX = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-20 h-20", xl: "w-32 h-32" } as const;
const GLYPH = { sm: "sm", md: "sm", lg: "xl", xl: "2xl" } as const;

const Avatar: React.FC<AvatarProps> = ({ src, name = "User", size = "md", className = "" }) => {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [src]);
  const box = `${BOX[size]} rounded-full ${className}`;

  if (src && !errored) {
    return <img src={src} alt={name} onError={() => setErrored(true)} className={`${box} object-cover`} />;
  }

  return (
    <div className={`${box} bg-primary flex items-center justify-center`} role="img" aria-label={name}>
      <Icon icon={User} size={GLYPH[size]} className="text-text" />
    </div>
  );
};

export default Avatar;
