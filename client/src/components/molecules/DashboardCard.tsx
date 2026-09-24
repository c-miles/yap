import React from 'react';

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
      className="w-full p-8 bg-surface border border-border rounded-lg enabled:hover:-translate-y-0.5 enabled:hover:border-accent transition-all duration-150 text-left group disabled:opacity-60 disabled:cursor-wait"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-accent-subtle rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold text-text mb-2">{title}</h3>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default DashboardCard;