import { ApiResponse } from '@calimero-network/calimero-client';

export interface GetPlayerState {}

export interface IncreaseCountRequest {
  count: number;
}

export interface IncreaseCountResponse {}

export interface ResetCounterResponse {}

export enum ClientMethod {
  GET_COUNT = 'get_count',
  INCREASE_COUNT = 'increase_count',
  RESET = 'reset',
}

export interface ClientApi {
  getPlayerStates(): ApiResponse<GetPlayerState>;
  increaseCount(
    params: IncreaseCountRequest,
  ): ApiResponse<IncreaseCountResponse>;
  reset(): ApiResponse<ResetCounterResponse>;
}
