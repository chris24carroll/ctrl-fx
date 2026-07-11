import { makeHttpRequest, type Effect } from '../effects'

import { failure, success, type Result } from '../utils/result'

export type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type HttpRequest = {
  readonly uri: string
  readonly method: Method
  readonly headers: Headers
  readonly body?: string // TODO:
}

export type Headers = {
  [key: string]: string
}

export type HttpResponse = {
  readonly status: number
  readonly headers: Headers
  readonly body: ResponseBody
}

export type HttpError = {
  _type: 'HttpError'
}

export type RequestError = {
  _type: 'RequestError'
  cause: 'RequestAborted' | 'NetworkFailure' | 'UnexpectedError'
  message: string
}

export type DecodingError = {
  _type: 'DecodingError'
  message: string
}

export class Json {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wrapped: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(wrapped: any) {
    this.wrapped = wrapped
  }

  decodeUnsafe<A>(): A {
    return this.wrapped
  }
}

export class ResponseBody {
  private data: ArrayBuffer

  constructor(data: ArrayBuffer) {
    this.data = data
  }

  asString(): string {
    return new TextDecoder().decode(this.data)
  }

  asBlob(): Blob {
    return new Blob([this.data])
  }

  asArrayBuffer(): ArrayBuffer {
    return this.data
  }

  /** Base64-encodes the response body into a `data:` URI. `mimeType` isn't known to `ResponseBody` itself (it's not `data`, it lives on the response's headers) so the caller must supply it. */
  asDataUri(mimeType: string): string {
    const bytes = new Uint8Array(this.data)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return `data:${mimeType};base64,${btoa(binary)}`
  }

  asJson(): Result<Json, DecodingError> {
    try {
      return success(new Json(JSON.parse(this.asString())))
    } catch (err) {
      if (err instanceof SyntaxError) {
        return failure({ _type: 'DecodingError', message: err.message })
      } else {
        return failure({
          _type: 'DecodingError',
          message: `Unexpected decoding error: ${err}`,
        })
      }
    }
  }
}

export function getJson<State, Event>(
  uri: string,
): Effect<
  State,
  Event,
  Result<Json, HttpError | RequestError | DecodingError>
> {
  return makeHttpRequest<State, Event>({
    uri,
    method: 'GET',
    headers: {},
  }).map(result =>
    result.andThen(rsp => {
      return rsp.body.asJson()
    }),
  )
}
