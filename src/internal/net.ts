import {
  ResponseBody,
  type Headers,
  type HttpError,
  type HttpRequest,
  type HttpResponse,
  type RequestError,
} from '../net'
import { failure, success, type Result } from '../utils/result'

export function makeHttpRequest(
  request: HttpRequest,
  callback: (result: Result<HttpResponse, RequestError | HttpError>) => void,
): void {
  console.log('About to fetch ' + request.uri)
  globalThis
    .fetch(request.uri, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
    .catch((err: unknown) => handleError(err, callback))
    .then(response => {
      if (response) {
        response
          .arrayBuffer()
          .catch((err: unknown) => handleError(err, callback))
          .then(ab => {
            if (ab) {
              callback(
                success({
                  status: response.status,
                  headers: convertHeaders(response.headers),
                  body: new ResponseBody(ab),
                }),
              )
            }
          })
      }
    })
}

function handleError(
  err: unknown,
  callback: (result: Result<HttpResponse, RequestError | HttpError>) => void,
): void {
  if (err instanceof DOMException && err.name === 'AbortError') {
    callback(
      failure({
        _type: 'RequestError',
        cause: 'RequestAborted',
        message: err.message,
      }),
    )
  } else if (err instanceof TypeError) {
    callback(
      failure({
        _type: 'RequestError',
        cause: 'NetworkFailure',
        message: err.message,
      }),
    )
  } else if (err instanceof Error) {
    callback(
      failure({
        _type: 'RequestError',
        cause: 'UnexpectedError',
        message: err.message,
      }),
    )
  } else {
    callback(
      failure({
        _type: 'RequestError',
        cause: 'UnexpectedError',
        message: `Unexpected request error: ${err}`,
      }),
    )
  }
}

function convertHeaders(headers: globalThis.Headers): Headers {
  const result: Headers = {}

  for (const [key, value] of headers) {
    result[key] = value
  }
  return result
}
