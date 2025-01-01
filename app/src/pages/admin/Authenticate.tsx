import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContentWrapper from '../../components/admin-login/ContentWrapper';
import LoginSelector from '../../components/admin-login/wallets/LoginSelector';

export default function AuthenticatePage() {
  const navigate = useNavigate();
  return (
    <ContentWrapper>
      <LoginSelector navigateStarknetLogin={() => navigate('/auth/starknet')} />
    </ContentWrapper>
  );
}
