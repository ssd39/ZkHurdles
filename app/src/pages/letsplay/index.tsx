// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  ClientApiDataSource,
  refresh_token,
} from '../../api/dataSource/ClientApiDataSource';
import { getGameCred } from '../../utils/storage';
import { bytesToBase58, bytesToString } from '../../utils/bs58';
import { toast } from 'react-toastify';

const UnityWebGL = () => {
  const [p1Health, setP1Health] = useState(15);
  const [p2Health, setP2Health] = useState(15);
  const [myId, setMyId] = useState(-1);
  const [contextId, setContextId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [showProgress, setProgress] = useState(true);
  const [progressNum, setProgressNum] = useState(0);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);

  useEffect(() => {
    // Load Unity instance
    if (window.UnityLoader) {
      window.unityInstance = window.UnityLoader.instantiate(
        'unityContainer',
        '/Build/WebBuild.json',
        {
          onProgress: (unityInstance, progress) => {
            setProgressNum(progress);
            if (progress >= 0.99) {
              setProgress(false);
            }
          },
        },
      );
    }
    // get current player
    let isNew = true;
    const gcred = getGameCred();
    setMyId(parseInt(gcred['GAME_PID']));
    setContextId(gcred['GAME_CONTEXT_ID']);
    setMemberId(gcred['GAME_ID']);
    let x = setInterval(async () => {
      await refresh_token();
      const result: any = await new ClientApiDataSource().getPlayerStates();
      const ps_data = result.data;
      const player1 = ps_data[0];
      const player2 = ps_data[1];
      setPlayer1(player1);
      setPlayer2(player2);

      if (myId == 0) {
        if (!player1.is_ready) {
          await new ClientApiDataSource().startRoom();
        }
      }
      if (myId == 1) {
        if (!player2.is_ready) {
          console.log('not ready');
          await new ClientApiDataSource().joinRoom();
        }
      }
    }, 1000);

    window.GetActiveTeamIndex = () => {
      return 0;
    };
    // send calimero tx to move player
    window.MoveMeToJS = (x, y) => {
      new ClientApiDataSource().moveTo(x, y).then((r) => {
        if (r.error) {
          toast.error('Failed to move');
        }
      });
      console.log('Moved to new position!!');
    };
    window.PlaceBlockerJS = (varient, x, y) => {};
    window.CanPlaceGrass = () => {};
    window.CanPlaceIce = () => {};
    window.GetHealth = (teamId) => {
      if (teamId == 0) {
        return p1Health;
      }
      return p2Health;
    };
    window.MyLockCountJS = () => {};

    return () => clearInterval(x);
  }, []);

  const handleFullscreen = () => {
    if (window.unityInstance) {
      window.unityInstance.SetFullscreen(1);
    }
  };

  return (
    <div className="webgl-content relative w-screen h-screen">
      <div className="!absolute left-2 top-0 z-30 flex items-center  p-4">
        {!showProgress && (
          <div className="flex flex-col space-y-2 ">
            <div className="glass-box p-4 rounded-lg bg-white/30 backdrop-blur-sm shadow-lg text-white">
              <h3 className="font-semibold ">Context ID</h3>
              <p className="text-black">{contextId}</p>
            </div>
            <div className="glass-box p-4 rounded-lg bg-white/30 backdrop-blur-sm shadow-lg text-white">
              <h3 className="font-semibold">Identity</h3>
              <p className="text-black">{memberId}</p>
            </div>
          </div>
        )}
        {showProgress && (
          <div className="w-full flex items-center justify-center text-2xl">
            <span>Loading game ({(progressNum * 100).toFixed(0)}% Loaded)</span>
          </div>
        )}
      </div>
      <div id="unityContainer" className="w-full h-full" />
    </div>
  );
};

export default UnityWebGL;
