export type DbError = UnexpectedError | NotFoundError | ConstraintError

export interface UnexpectedError {
  readonly _type: 'UnexpectedError'
  readonly message?: string
  readonly cause?: Error
}

export interface NotFoundError {
  readonly _type: 'NotFoundError'
  readonly cause: Error
}

export interface ConstraintError {
  readonly _type: 'ConstraintError'
  readonly cause: Error
}

export function unexpectedError(params: {
  cause?: Error
  message?: string
}): DbError {
  return {
    _type: 'UnexpectedError',
    cause: params.cause,
    message: params.message,
  }
}

export function notFoundError(cause: Error): DbError {
  return { _type: 'NotFoundError', cause }
}

export function constraintError(cause: Error): DbError {
  return { _type: 'ConstraintError', cause }
}
