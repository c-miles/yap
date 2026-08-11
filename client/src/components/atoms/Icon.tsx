import React from "react";
import { LucideIcon, LucideProps } from "lucide-react";

// three sizes, one stroke weight tuned for 16-24px — lucide's 2px default
// is heavy at these sizes.
const SIZES = { sm: 16, md: 20, lg: 24 } as const;

interface IconProps extends Omit<LucideProps, "size"> {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
}

const Icon: React.FC<IconProps> = ({ icon: Glyph, size = "md", strokeWidth = 1.75, ...props }) => (
  <Glyph size={SIZES[size]} strokeWidth={strokeWidth} {...props} />
);

export default Icon;
