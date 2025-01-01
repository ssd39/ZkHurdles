import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupModal } from '@calimero-network/calimero-client';
import ContentWrapper from '../../components/login/ContentWrapper';
import { getNodeUrl, getStorageApplicationId } from '../../utils/node';
import {
  setStorageAppEndpointKey,
  setStorageApplicationId,
  isNodeAuthorized,
} from '../../utils/storage';

export default function SetupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isNodeAuthorized()) {
      navigate('/lobby');
    }
  }, []);

  return (
    <ContentWrapper>
      <SetupModal
        successRoute={() => navigate('/admin-auth')}
        getNodeUrl={getNodeUrl}
        setNodeUrl={setStorageAppEndpointKey}
        setApplicationId={setStorageApplicationId}
        getApplicationId={getStorageApplicationId}
      />
    </ContentWrapper>
  );
}
