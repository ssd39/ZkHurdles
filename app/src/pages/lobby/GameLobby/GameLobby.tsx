import React, { useEffect, useState } from 'react';
import { Trophy, LogOut } from 'lucide-react';
import InfoCard from './InfoCard';
import BalanceCard from './BalanceCard';
import ActionButton from './ActionButton';
import { useStarknet } from '../../../hooks/useStarknet';
import { getApplicationId, getWalletAddress } from '../../../utils/storage';
import { useServerDown } from '../../../context/ServerDownContext';
import apiClient from '../../../api/admin';
import { toast } from 'react-toastify';
import { isNodeAuthorized } from '../../../utils/storage';
import { useNavigate } from 'react-router-dom';

interface GameLobbyProps {}

const GameLobby: React.FC<GameLobbyProps> = ({}) => {
  const starknet = useStarknet();
  const { showServerDownPopup } = useServerDown();
  const [playButtonState, setPlayButtonState] = useState(-1);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(getWalletAddress() || '');
  const [balance, setBalance] = useState('');
  const [appId, setAppId] = useState(getApplicationId() || '');
  const [contextId, setContextId] = useState("")
  const [memberPubKey, setMemberPubKey] = useState("")
  const nvaigate = useNavigate()
  useEffect(() => {
    if(!isNodeAuthorized()) {
      nvaigate("/")
    } 
    console.log(starknet.starknetInstance);
  }, []);

  const handlePlay = async () => {
    setPlayButtonState(0);
    try {
      // check logic if room need to create
      const node = await apiClient(showServerDownPopup).node();
      if (false && walletAddress != "0x78ff444c32ac1a3703281f8e47223a9c57c83469bf5056ee1eca093da289fcf") {
        // create context
        // use context id then call create_room contract call
        const context = await node.createContexts(appId, "")
        // cretate token for the context id
        const contextId = context.data?.contextId;
        setContextId(contextId || "")
        if (contextId) {
          toast.success(`🎉 New context created: ${contextId} ✅`)
          const context_identities = (await node.getContextIdentity(contextId)).data?.identities
          if(context_identities && context_identities?.length > 0) {
            const context_identity = context_identities[0];
            const token = await node.createAccessToken(contextId, context_identity)
            console.log(context_identities)
            console.log(context)
            console.log(token)
            // now wait for the other player to join the room
            // we will listen on contract and as soon as other player joins we invite them
          }
        }
      } else {
        // join the room already availabel .
        // join it using the peer id so other party can invite you
       // const res = await node.createNewIdentity()
       const identity = await node.createNewIdentity()
       console.log(identity)
      }
    } finally {
      setPlayButtonState(-1);
    }
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setIsClaimLoading(true);
    try {
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              zkHurdles
            </h1>
            <p className="text-lg text-gray-300">Race, Compete, Conquer!</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <div className="grid gap-6 mb-8">
              <InfoCard label="Wallet Address" value={walletAddress} />
              <InfoCard label="Calimero App ID" value={appId} />
              <BalanceCard
                balance={balance}
                onClaimBonus={handleClaimBonus}
                isClaimLoading={isClaimLoading}
              />
            </div>

            <div className="flex flex-col gap-4">
              <ActionButton
                onClick={handlePlay}
                variant="primary"
                isLoading={playButtonState != -1}
              >
                {playButtonState == -1 && (
                  <>
                    <Trophy className="w-6 h-6" />
                    Let's Play
                  </>
                )}
                {playButtonState == -0 && (
                  <>
                    <span>Loading...</span>
                  </>
                )}
              </ActionButton>

              <ActionButton
                onClick={handleLogout}
                variant="secondary"
                isLoading={isLogoutLoading}
              >
                <LogOut className="w-6 h-6" />
                Logout
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
