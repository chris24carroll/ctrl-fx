export type DownField = { _tag: 'down_field'; value: string }
export type DownArray = { _tag: 'down_array'; index: number }
export type PathElem = DownField | DownArray

export type Valid<A> = {
  _tag: 'valid'
  value: A
}

export type Invalid = {
  _tag: 'invalid'
  path: PathElem[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  expectedType: string
  reason: string
}

export function fieldToPath(field: string): PathElem[] {
  return [
    {
      _tag: 'down_field',
      value: field,
    },
  ]
}

export type ValidationResult<A> = Valid<A> | Invalid

export interface Validator<A> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(value: any): ValidationResult<A>

  map<B>(f: (a: A) => B): Validator<B>

  andThen<B>(f: (a: A) => ValidationResult<B>): Validator<B>
}
