import { getJWT, getGameCred } from './storage';

export interface AxiosHeader {
  [key: string]: string;
}

export function createJwtHeader(): AxiosHeader | null {
  const token: string | null = getGameCred()['GAME_TOKEN'].access_token;
  if (!token) {
    return null;
  }

  const headers: AxiosHeader = {
    authorization: `Bearer ${token}`,
  };
  return headers;
}
