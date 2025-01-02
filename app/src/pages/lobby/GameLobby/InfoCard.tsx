import React from 'react';

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon }) => (
  <div className="bg-white/5 rounded-xl p-4">
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <p className="font-mono text-md flex items-center gap-2">
      {icon}
      {value}
    </p>
  </div>
);

export default InfoCard;