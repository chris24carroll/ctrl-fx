import { clipboardError, type ClipboardError } from '../clipboard'
import { failure, success, type Result } from '../utils/result'

export function writeClipboard(
  text: string,
  callback: (result: Result<void, ClipboardError>) => void,
): void {
  if (!globalThis.navigator?.clipboard?.writeText) {
    callback(
      failure(clipboardError('NotSupported', 'Clipboard API not available')),
    )
    return
  }
  globalThis.navigator.clipboard
    .writeText(text)
    .then(() => callback(success(undefined)))
    .catch((err: unknown) => callback(failure(toClipboardError(err))))
}

export function readClipboard(
  callback: (result: Result<string, ClipboardError>) => void,
): void {
  if (!globalThis.navigator?.clipboard?.readText) {
    callback(
      failure(clipboardError('NotSupported', 'Clipboard API not available')),
    )
    return
  }
  globalThis.navigator.clipboard
    .readText()
    .then(text => callback(success(text)))
    .catch((err: unknown) => callback(failure(toClipboardError(err))))
}

function toClipboardError(err: unknown): ClipboardError {
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    return clipboardError('NotAllowed', err.message)
  } else if (err instanceof Error) {
    return clipboardError('UnexpectedError', err.message)
  } else {
    return clipboardError('UnexpectedError', `Unexpected clipboard error: ${err}`)
  }
}
