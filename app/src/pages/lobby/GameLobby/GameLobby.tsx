import React, { useEffect, useState } from 'react';
import { Trophy, LogOut } from 'lucide-react';
import InfoCard from './InfoCard';
import BalanceCard from './BalanceCard';
import ActionButton from './ActionButton';
import { useStarknet } from '../../../hooks/useStarknet';
import {
  clearStorage,
  getApplicationId,
  getWalletAddress,
  getWalletType,
} from '../../../utils/storage';
import { useServerDown } from '../../../context/ServerDownContext';
import apiClient from '../../../api/admin';
import { toast } from 'react-toastify';
import { isNodeAuthorized } from '../../../utils/storage';
import { useNavigate } from 'react-router-dom';
import {
  claim_bonus,
  createRoom,
  getBalance,
  getInvitePayload,
  getOpponent,
  isClaimedBonus,
  isCreateRoom,
  joinRoom,
  sendInvitePayload,
} from '../../../utils/starknet';

interface GameLobbyProps {}

const GameLobby: React.FC<GameLobbyProps> = ({}) => {
  const starknet = useStarknet();
  const { showServerDownPopup } = useServerDown();
  const [playButtonState, setPlayButtonState] = useState(-1);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [isBonusClaimed, setIsClaimed] = useState(true);
  const [walletAddress, setWalletAddress] = useState(getWalletAddress() || '');
  const [balance, setBalance] = useState('0');
  const [appId, setAppId] = useState(getApplicationId() || '');
  const [contextId, setContextId] = useState('');
  const [roomId, setRoomId] = useState(-1);

  const navigate = useNavigate();

  const getWalletInstance = async () => {
    if (!starknet.starknetInstance) {
      const wType = getWalletType();
      if (wType) {
        console.log('roar');
        return await starknet.walletLogin_(wType.toString(), toast.error);
      }
    }
    console.log(starknet.starknetInstance);
    return starknet.starknetInstance;
  };

  useEffect(() => {
    if (!isNodeAuthorized()) {
      navigate('/');
      return;
    }
    getBalance().then((balance) => {
      setBalance(balance);
    });
    isClaimedBonus().then((is_claimed) => {
      setIsClaimed(is_claimed);
    });
    /*getWalletInstance().then((walletInstance) => {
      
      console.log(walletInstance)
    })*/
  }, []);

  const handlePlay = async () => {
    setPlayButtonState(0);
    try {
      const walletInstance: any = await getWalletInstance();
      const is_create_room = await isCreateRoom();
      // check logic if room need to create
      const node = await apiClient(showServerDownPopup).node();
      const isAppInstalled = await node
        .getInstalledApplicationDetails(appId)
        .then((data) => {
          return !(data.error?.code == 404);
        })
        .catch(() => false);
      console.log('isAppInstalled:', isAppInstalled);
      if (!isAppInstalled) {
        await node.installApplication(
          '6ec4f270f40a75d4de705243ff14dd197d3971d6bef6f7d182d92fe019bd5c2c',
          '0.1',
          'https://blobby-public.euw3.prod.gcp.calimero.network/bafybeicp5x4rapv32q5poagiqfhggwwadcvvcwsm5ex45rq3ho346p2k6q',
          'b3be1f24e0244a59ceed689ef1a54fc8e6d5c9025cb44a6e7310a6bbd5a5cfe8',
        );
      }
      if (is_create_room) {
        // create context
        // use context id then call create_room contract call
        const context = await node.createContexts(appId, '');
        // cretate token for the context id
        const contextId = context.data?.contextId;
        setContextId(contextId || '');
        if (contextId) {
          toast.success(`🎉 New context created: ${contextId} ✅`);
          const context_identities = (await node.getContextIdentity(contextId))
            .data?.identities;
          if (context_identities && context_identities?.length > 0) {
            const context_identity = context_identities[0];
            const token = await node.createAccessToken(
              contextId,
              context_identity,
            );
            console.log(context_identities);
            console.log(context);
            console.log(token);

            const roomId_ = await createRoom(walletInstance, contextId);
            getBalance().then((balance) => {
              setBalance(balance);
            });
            console.log(roomId_);
            setRoomId(roomId_);
            setPlayButtonState(1);
            const contex_identity: any = await getOpponent(roomId_);
            console.log('contex_identity:', contex_identity.context_identity);
            const inviteRes = await node.createInvite({
              contextId: contextId,
              inviteeId: contex_identity.context_identity,
              inviterId: context_identity,
            });
            console.log(inviteRes);
            if (inviteRes.data) {
              await sendInvitePayload(
                walletInstance,
                roomId_,
                inviteRes.data.toString(),
              );
            }
            setPlayButtonState(2);
            // now wait for the other player to join the room
            // we will listen on contract and as soon as other player joins we invite them
            localStorage.setItem('GAME_TOKEN', JSON.stringify(token.data));
            localStorage.setItem('GAME_CONTEXT_ID', contextId);
            localStorage.setItem('GAME_ID', context_identity);
            localStorage.setItem('GAME_PID', '0');
            toast.success('Woohoo! 🎉 All set, now starting a game! 🎮✨');
            navigate('/letsplay');
            setPlayButtonState(-1);
          }
        }
      } else {
        // game context id: 3aVzKtgGccq4SgWnWhUmPzwrqDhrhk7R1719hdcRdj2A
        // join the room already availabel .
        // join it using the peer id so other party can invite you
        const identity = await node.createNewIdentity();
        console.log(identity.data);
        if (identity.data?.publicKey) {
          const roomId_ = await joinRoom(
            walletInstance,
            identity.data?.publicKey,
          );
          getBalance().then((balance) => {
            setBalance(balance);
          });
          console.log(roomId_);
          setRoomId(roomId_);
          // check for invite if we have jon that
          setPlayButtonState(3);
          const invitePayload: any = await getInvitePayload(roomId_);
          console.log('invitePayload:', invitePayload);
          if (invitePayload.payload) {
            const joinData = await node.joinInvite({
              invitationPayload: invitePayload.payload,
              privateKey: identity.data.privateKey,
            });
            const token = await node.createAccessToken(
              joinData.data?.contextId || '',
              joinData.data?.memberPublicKey || '',
            );
            toast.success(
              'Woohoo! 🎉 Joined the room 🏠, now starting a game! 🎮✨',
            );
            console.log(token);
            localStorage.setItem('GAME_TOKEN', JSON.stringify(token.data));
            localStorage.setItem(
              'GAME_CONTEXT_ID',
              joinData.data?.contextId || '',
            );
            localStorage.setItem(
              'GAME_ID',
              joinData.data?.memberPublicKey || '',
            );
            localStorage.setItem('GAME_PID', '1');
            navigate('/letsplay');
            setPlayButtonState(-1);
          }
        }
      }
    } finally {
      setPlayButtonState(-1);
    }
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      clearStorage();
      navigate('/');
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setIsClaimLoading(true);
    try {
      const walletInstance: any = await getWalletInstance();

      console.log(walletInstance);
      await claim_bonus(walletInstance);
      await getBalance().then((balance) => {
        setBalance(balance);
      });
      setIsClaimed(true);
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
              <InfoCard
                label="Wallet Address"
                value={walletAddress.toString()}
              />
              <InfoCard label="Calimero App ID" value={appId} />
              <BalanceCard
                balance={balance}
                isClaimed={isBonusClaimed}
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
                {playButtonState == 1 && (
                  <>
                    <span>Waiting for someone to join room.</span>
                  </>
                )}
                {playButtonState == 2 && (
                  <>
                    <span>Waiting for opponent to accept invite.</span>
                  </>
                )}
                {playButtonState == 3 && (
                  <>
                    <span>Waiting for invite.</span>
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
