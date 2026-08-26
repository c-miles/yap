import React from 'react';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  description,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-8 bg-surface border border-border rounded-lg hover:scale-105 hover:border-primary transition-all duration-150 text-left group"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center group-hover:bg-primary-hov transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-text mb-2">{title}</h3>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default DashboardCard;