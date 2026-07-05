export type ClipboardError = {
  _type: 'ClipboardError'
  cause: 'NotAllowed' | 'NotSupported' | 'UnexpectedError'
  message: string
}

export function clipboardError(
  cause: ClipboardError['cause'],
  message: string,
): ClipboardError {
  return { _type: 'ClipboardError', cause, message }
}
