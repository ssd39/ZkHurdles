import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import Crypto from 'libp2p-crypto';
import bs58 from 'bs58'

enum RequestType {
  Get = 'GET',
  Post = 'POST',
  Delete = 'DELETE'
}

interface ApiError {
  statusCode: number
  message: string
}

class ApiRequestError extends Error {
  statusCode: number

  constructor(error: ApiError) {
    super(error.message)
    this.statusCode = error.statusCode
    this.name = 'ApiRequestError'
  }
}

async function doRequest<I, O>(
  url: string,
  body: I | null,
  privateKey: Crypto.PrivateKey,
  reqType: RequestType
): Promise<O> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const messageBytes = uint8ArrayFromString(timestamp)
  const signature = await privateKey.sign(messageBytes)
  
  const headers: HeadersInit = {
    'X-Signature': bs58.encode(signature),
    'X-Timestamp': timestamp
  }

  const requestOptions: RequestInit = {
    method: reqType,
    headers
  }

  if (reqType === RequestType.Post && body) {
    requestOptions.body = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(url, requestOptions)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiRequestError({
      statusCode: response.status,
      message: errorText
    })
  }

  return response.json() as Promise<O>
}

export { doRequest, RequestType, ApiRequestError }
export type { ApiError }