import React from 'react';
import { styled } from 'styled-components';
import translations from '../../../constants/en.global.json';
import StarknetIcon from '../../../assets/starknet-icon.svg';

export interface LoginSelectorProps {
  navigateStarknetLogin: () => void | undefined;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1c1c1c;
  gap: 1rem;
  border-radius: 0.5rem;
  width: fit-content;

  .container {
    padding: 2rem;
  }

  .center-container {
    width: 100%;
    text-align: center;
    color: white;
    margin-top: 0.375rem;
    margin-bottom: 0.375rem;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: medium;
  }

  .flex-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    padding-top: 3.125rem;
  }

  .login-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.125rem;
    height: 2.875rem;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 500;
    line-height: 1.25rem;
    border-radius: 0.375rem;
    color: white;
    border: none;
    outline: none;
  }

  .metamask-btn {
    background-color: #ff7a00;
  }
`;

export default function LoginSelector({
  navigateStarknetLogin,
}: LoginSelectorProps) {
  const t = translations.loginPage.loginSelector;
  return (
    <Wrapper>
      <div className="container">
        <div className="center-container">{t.title}</div>
        <div className="flex-container">
          <button className="login-btn" onClick={navigateStarknetLogin}>
            <img src={StarknetIcon as unknown as string} alt="starknet-icon" />
            <span>{t.starknetButtonText}</span>
          </button>
        </div>
      </div>
    </Wrapper>
  );
}
