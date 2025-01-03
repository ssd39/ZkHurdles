import React from 'react';
import { Coins } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface BalanceCardProps {
  balance: string;
  onClaimBonus: () => void;
  isClaimLoading?: boolean;
  isClaimed?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  onClaimBonus,
  isClaimLoading = false,
  isClaimed = false,
}) => (
  <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
    <div>
      <p className="text-gray-400 text-sm mb-1">Balance</p>
      <p className="font-mono text-md flex items-center">
        <Coins className="w-5 h-5 mr-2 text-yellow-400" />
        {balance}
      </p>
    </div>
    <button
      onClick={onClaimBonus}
      disabled={isClaimLoading || isClaimed}
      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 font-semibold text-black disabled:from-yellow-400/50 disabled:to-orange-500/50 flex items-center gap-2"
    >
      {isClaimLoading ? (
        <>
          <LoadingSpinner />
          <span>Claiming...</span>
        </>
      ) : (
        'Claim Joining Bonus'
      )}
    </button>
  </div>
);

export default BalanceCard;
