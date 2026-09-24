import React from "react";
import { BeatLoader } from "react-spinners";
import Text from "./Text";

const Spinner: React.FC<{ label?: string; className?: string }> = ({ label, className = "" }) => (
  <div role="status" className={`flex flex-col items-center gap-4 ${className}`}>
    <BeatLoader color="var(--accent)" aria-label="Loading" />
    {label && <Text variant="secondary">{label}</Text>}
  </div>
);

export default Spinner;
