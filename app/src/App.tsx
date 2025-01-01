import React, { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import GamePage from './pages/game';
import SetupPage from './pages/setup';
import LobbyPage from './pages/lobby';
import Authenticate from './pages/login/Authenticate';
import AdminAuthenticate from './pages/admin/Authenticate';
import StarknetLogin from './pages/admin/Starknet';
import { AccessTokenWrapper } from '@calimero-network/calimero-client';
import { getNodeUrl } from './utils/node';
import { useServerDown } from './context/ServerDownContext';
import { setNodeUrlFromQuery } from './utils/storage';

export default function App() {
  const { showServerDownPopup } = useServerDown();

  useEffect(() => {
    setNodeUrlFromQuery(showServerDownPopup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AccessTokenWrapper getNodeUrl={getNodeUrl}>
      <BrowserRouter basename="/game/">
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/admin-auth" element={<AdminAuthenticate />} />
          <Route
            path="/auth/starknet"
            element={<StarknetLogin isLogin={true} />}
          />
          <Route path="/game-auth" element={<Authenticate />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
        </Routes>
      </BrowserRouter>
    </AccessTokenWrapper>
  );
}
