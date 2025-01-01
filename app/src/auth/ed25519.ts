import Crypto from 'libp2p-crypto';
import bs58 from 'bs58';
import { getStorageClientKey, setStorageClientKey } from './storage';
import { ClientKey } from './types';

export async function generatePrivateKey(): Promise<Crypto.PrivateKey> {
  return await Crypto.keys.generateKeyPair('Ed25519');
}

export async function getOrCreateKeypair(): Promise<ClientKey> {
  return getStorageClientKey() ?? createAndStoreClientKey();
}

async function createAndStoreClientKey() {
  const privateKey = await generatePrivateKey();
  const clientKey: ClientKey = {
    privateKey: bs58.encode(privateKey.bytes),
    publicKey: bs58.encode(privateKey.public.bytes),
  };
  setStorageClientKey(clientKey);

  return clientKey;
}
