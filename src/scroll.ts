export type ScrollElementError = {
  _type: 'ScrollElementError'
  cause: 'ElementNotFound'
  selector: string
}

export function scrollElementError(selector: string): ScrollElementError {
  return { _type: 'ScrollElementError', cause: 'ElementNotFound', selector }
}
