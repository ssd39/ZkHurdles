import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = 'primary',
  children,
  isLoading = false,
  disabled = false,
}) => {
  const baseStyles =
    'w-full py-4 rounded-xl transition-all duration-200 font-bold text-lg flex items-center justify-center gap-3';
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 disabled:from-green-400/50 disabled:to-emerald-500/50',
    secondary:
      'bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
    >
      {isLoading && (
        <>
          <LoadingSpinner />
        </>
      )}
      {children}
    </button>
  );
};

export default ActionButton;
