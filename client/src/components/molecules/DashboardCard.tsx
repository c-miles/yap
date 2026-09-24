import React from 'react';
import { Heading, Text } from "../atoms";

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  busy?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  description,
  onClick,
  busy
}) => {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="focus-ring glass w-full p-8 rounded-xl enabled:hover:-translate-y-0.5 transition-base text-left disabled:opacity-60 disabled:cursor-wait"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-accent-subtle rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div>
          <Heading className="mb-2">{title}</Heading>
          <Text variant="muted" className="text-sm">{description}</Text>
        </div>
      </div>
    </button>
  );
};

export default DashboardCard;