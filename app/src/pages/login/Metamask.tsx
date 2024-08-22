import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getContextId, getNodeUrl } from '../../utils/node';
import { MetamaskWrapper } from '@calimero-is-near/calimero-p2p-sdk';
import ContentWrapper from '../../components/login/ContentWrapper';

export default function MetamaskPage() {
  const navigate = useNavigate();
  return (
    <ContentWrapper>
      <MetamaskWrapper
        contextId={getContextId()}
        rpcBaseUrl={getNodeUrl()}
        successRedirect={() => navigate('/home')}
        navigateBack={() => navigate('/')}
        clientLogin={true}
      />
    </ContentWrapper>
  );
}
