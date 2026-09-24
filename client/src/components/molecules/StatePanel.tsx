import React from "react";
import { Card, Heading, Text } from "../atoms";

interface StatePanelProps {
  title: string;
  description?: React.ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
  children?: React.ReactNode;
}

const StatePanel: React.FC<StatePanelProps> = ({ title, description, headingLevel = 1, className = "", children }) => (
  <Card className={`w-full max-w-md text-center ${className}`}>
    <Heading level={headingLevel}>{title}</Heading>
    {description && (
      <Text variant="secondary" className="mt-2">
        {description}
      </Text>
    )}
    {children && <div className="mt-6 flex flex-col gap-3">{children}</div>}
  </Card>
);

export default StatePanel;
