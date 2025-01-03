import { getAccessToken } from '@calimero-network/calimero-client';
import { HealthStatus } from '../api/admin/dataSource/NodeDataSource';
import { ResponseData } from '../api/admin/response';
import apiClient from '../api/admin';

export const APP_URL = 'app-url';
export const CONTEXT_IDENTITY = 'context-identity';
export const CONTEXT_ID = 'context-id';
export const APPLICATION_ID = 'application-id';
const NODE_URL = 'node-url';
const AUTHORIZED = 'node-authorized';
const CLIENT_KEY = 'client-key';
const WALLET_ADDRESS = 'WALLET_ADDRESS';
const WALLET_TYPE = 'WALLET_TYPE';

export interface ClientKey {
  privateKey: string;
  publicKey: string;
}

export const clearStorage = () => {
  localStorage.removeItem(APP_URL);
  localStorage.removeItem(AUTHORIZED);
  localStorage.removeItem(CLIENT_KEY);
};

export const getStorageAppEndpointKey = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let storageRecord: string | null = localStorage.getItem(APP_URL);
      if (storageRecord) {
        let url: string = JSON.parse(storageRecord);
        if (url && url.length > 0) {
          return url;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const getWalletAddress = (): String | null => {
  return localStorage.getItem(WALLET_ADDRESS);
};

export const getWalletType = (): String | null => {
  return localStorage.getItem(WALLET_TYPE);
};

export const getStorageExecutorPublicKey = (): String | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let contextIdentity: string = JSON.parse(
        localStorage.getItem(CONTEXT_IDENTITY) ?? '',
      );
      return contextIdentity;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const setStorageAppEndpointKey = (url: string) => {
  localStorage.setItem(APP_URL, JSON.stringify(url));
};

export const getStorageContextId = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storageContextId = localStorage.getItem(CONTEXT_ID);
    if (storageContextId) {
      return JSON.parse(storageContextId);
    }
  }
  return null;
};

export const setStorageContextId = (contextId: string) => {
  localStorage.setItem(CONTEXT_ID, JSON.stringify(contextId));
};

export const clearAppEndpoint = () => {
  localStorage.removeItem(APP_URL);
};

export const clearApplicationId = () => {
  localStorage.removeItem(APPLICATION_ID);
};

export const getApplicationId = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storageApplicationId = localStorage.getItem(APPLICATION_ID);
    if (storageApplicationId) {
      return JSON.parse(storageApplicationId);
    }
  }
  return null;
};

export const getGameCred = (): any | null => {
  return {
    GAME_CONTEXT_ID: localStorage.getItem('GAME_CONTEXT_ID'),
    GAME_TOKEN: JSON.parse(localStorage.getItem('GAME_TOKEN') || '{}'),
    GAME_ID: localStorage.getItem('GAME_ID'),
    GAME_PID: localStorage.getItem('GAME_PID'),
  };
};

export const setStorageApplicationId = (applicationId: string) => {
  localStorage.setItem(APPLICATION_ID, JSON.stringify(applicationId));
};

export const isNodeAuthorized = (): boolean => {
  const authorized = localStorage.getItem(AUTHORIZED);
  return authorized ? JSON.parse(authorized) : false;
};

export interface JsonWebToken {
  context_id: string;
  token_type: string;
  exp: number;
  sub: string;
  executor_public_key: string;
}

export const getJWTObject = (): JsonWebToken | null => {
  const token = getGameCred()['GAME_TOKEN'].access_token;
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }
  const payload = JSON.parse(atob(parts[1]));
  return payload;
};

export const getJWT = (): string | null => {
  return getAccessToken();
};

const verifyNodeUrl = async (
  url: string,
  showServerDownPopup: () => void,
): Promise<boolean> => {
  try {
    new URL(url);
    const response: ResponseData<HealthStatus> = await apiClient(
      showServerDownPopup,
    )
      .node()
      .health({ url: url });
    if (response.data) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const setNodeUrlFromQuery = async (showServerDownPopup: () => void) => {
  const urlParams = new URLSearchParams(window.location.search);
  const nodeUrl = urlParams.get(NODE_URL);
  if (nodeUrl && (await verifyNodeUrl(nodeUrl, showServerDownPopup))) {
    setStorageAppEndpointKey(nodeUrl);
    const newUrl = `${window.location.pathname}auth`;
    window.location.href = newUrl;
  } else if (!nodeUrl) {
    return;
  } else {
    window.alert('Node URL is not valid or not reachable. Please try again.');
  }
};
