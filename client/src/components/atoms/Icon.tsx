import React from "react";
import { LucideIcon, LucideProps } from "lucide-react";

// one stroke weight across 16-48px. lucide's 2px default is too heavy at these sizes.
const SIZES = { sm: 16, md: 20, xl: 32, "2xl": 48 } as const;

interface IconProps extends Omit<LucideProps, "size"> {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
}

const Icon: React.FC<IconProps> = ({ icon: Glyph, size = "md", strokeWidth = 1.75, ...props }) => (
  <Glyph size={SIZES[size]} strokeWidth={strokeWidth} {...props} />
);

export default Icon;
