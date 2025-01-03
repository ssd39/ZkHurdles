import {
  ApiResponse,
  JsonRpcClient,
  RequestConfig,
  WsSubscriptionsClient,
  RpcError,
  handleRpcError,
} from '@calimero-network/calimero-client';
import {
  ClientApi,
  ClientMethod,
  GetPlayerState,
  IncreaseCountRequest,
  IncreaseCountResponse,
  ResetCounterResponse,
} from '../clientApi';
import { getContextId, getNodeUrl } from '../../utils/node';
import {
  getGameCred,
  getJWTObject,
  getStorageAppEndpointKey,
  JsonWebToken,
} from '../../utils/storage';
import { AxiosHeader, createJwtHeader } from '../../utils/jwtHeaders';
import { getRpcPath } from '../../utils/env';

export function getJsonRpcClient() {
  return new JsonRpcClient(getStorageAppEndpointKey() ?? '', getRpcPath());
}

export function getWsSubscriptionsClient() {
  return new WsSubscriptionsClient(getStorageAppEndpointKey() ?? '', '/ws');
}

function getConfigAndJwt() {
  const jwtObject: JsonWebToken | null = getJWTObject();
  const headers: AxiosHeader | null = createJwtHeader();
  if (!headers) {
    return {
      error: { message: 'Failed to create auth headers', code: 500 },
    };
  }
  if (!jwtObject) {
    return {
      error: { message: 'Failed to get JWT token', code: 500 },
    };
  }
  if (jwtObject.executor_public_key === null) {
    return {
      error: { message: 'Failed to get executor public key', code: 500 },
    };
  }

  const config: RequestConfig = {
    headers: headers,
    timeout: 10000,
  };

  return { jwtObject, config };
}

export class ClientApiDataSource implements ClientApi {
  private async handleError(
    error: RpcError,
    params: any,
    callbackFunction: any,
  ) {
    if (error && error.code) {
      const response = await handleRpcError(error, getNodeUrl);
      if (response.code === 403) {
        return await callbackFunction(params);
      }
      return {
        error: await handleRpcError(error, getNodeUrl),
      };
    }
  }
  async getPlayerStates(): ApiResponse<any> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, any>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: 'get_players_state',
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.getPlayerStates);
    }

    return {
      data: response?.result?.output,
      error: null,
    };
  }

  async getActivePlayer(): ApiResponse<any> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, any>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: 'get_round',
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.getActivePlayer);
    }

    return {
      data: response?.result?.output,
      error: null,
    };
  }

  async startRoom(): ApiResponse<any> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, any>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: 'start_room',
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.getPlayerStates);
    }

    return {
      data: response?.result?.output,
      error: null,
    };
  }

  async moveTo(x: number, y: number): ApiResponse<any> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, any>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: 'take_move_chance',
        argsJson: { x, y },
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.getPlayerStates);
    }

    return {
      data: response?.result?.output,
      error: null,
    };
  }
  async joinRoom(): ApiResponse<any> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, any>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: 'join_room',
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.getPlayerStates);
    }

    return {
      data: response?.result?.output,
      error: null,
    };
  }

  async increaseCount(
    params: IncreaseCountRequest,
  ): ApiResponse<IncreaseCountResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().mutate<
      IncreaseCountRequest,
      IncreaseCountResponse
    >(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.INCREASE_COUNT,
        argsJson: params,
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.increaseCount);
    }

    return {
      data: Number(response?.result?.output) ?? null,
      error: null,
    };
  }

  async reset(): ApiResponse<ResetCounterResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().mutate<any, ResetCounterResponse>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.RESET,
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.reset);
    }

    return {
      data: Number(response?.result?.output) ?? null,
      error: null,
    };
  }
}

export const refresh_token = async () => {
  const jwt = getJWTObject();
  const gAuth = getGameCred();
  if (!jwt?.exp || (jwt?.exp && jwt?.exp <= Math.floor(Date.now() / 1000))) {
    console.log(jwt?.exp);
    console.log(Math.floor(Date.now() / 1000));
    ///refresh-jwt-token
    const res = await (
      await fetch(`${getStorageAppEndpointKey()}/admin-api/refresh-jwt-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: gAuth['GAME_TOKEN'].refresh_token,
        }),
      })
    ).json();
    console.log(res);
    localStorage.setItem('GAME_TOKEN', JSON.stringify(res?.data || '{}'));
  }
};
