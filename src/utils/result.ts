/** The success variant of a Result. */
export type Success<A, E> = {
  _tag: 'success'
  value: A
  /** Transforms the success value, leaving failure unchanged. */
  map<B>(f: (a: A) => B): Result<B, E>
  /** Chains a function that can fail, short-circuiting on existing failure. */
  andThen<B, EE>(f: (a: A) => Result<B, EE>): Result<B, E | EE>
  /** Transforms the error value, leaving success unchanged. */
  errorMap<EE>(f: (e: E) => EE): Result<A, EE>
  /** Returns either the success value or the error value. */
  merge(): A | E
  /** Recovers from failure by applying `f` to the error. */
  recover<AA, EE>(f: (e: E) => Result<AA, EE>): Result<A | AA, E | EE>
  /** Applies `onSuccess` or `onError` and returns a single value. */
  fold<T>(onSuccess: (a: A) => T, onError: (e: E) => T): T
}

/** The failure variant of a Result. */
export type Failure<A, E> = {
  _tag: 'failure'
  error: E
  /** Transforms the success value, leaving failure unchanged. */
  map<B>(f: (a: A) => B): Result<B, E>
  /** Chains a function that can fail, short-circuiting on existing failure. */
  andThen<B, EE>(f: (a: A) => Result<B, EE>): Result<B, E | EE>
  /** Transforms the error value, leaving success unchanged. */
  errorMap<EE>(f: (e: E) => EE): Result<A, EE>
  /** Returns either the success value or the error value. */
  merge(): A | E
  /** Recovers from failure by applying `f` to the error. */
  recover<AA, EE>(f: (e: E) => Result<AA, EE>): Result<A | AA, E | EE>
  /** Applies `onSuccess` or `onError` and returns a single value. */
  fold<T>(onSuccess: (a: A) => T, onError: (e: E) => T): T
}

function map<A, E, B>(f: (a: A) => B) {
  return (result: Result<A, E>) => {
    switch (result._tag) {
      case 'failure': {
        return failure<B, E>(result.error)
      }
      case 'success': {
        return success<B, E>(f(result.value))
      }
    }
  }
}

function andThen<A, E, B, EE>(f: (a: A) => Result<B, EE>) {
  return (result: Result<A, E>) => {
    switch (result._tag) {
      case 'failure': {
        return failure<B, E | EE>(result.error)
      }
      case 'success': {
        return f(result.value)
      }
    }
  }
}

/** A value that is either a success (`A`) or a failure (`E`). */
export type Result<A, E> = Success<A, E> | Failure<A, E>

/** Creates a successful Result. */
export function success<A, E>(value: A): Result<A, E> {
  return {
    _tag: 'success',
    value,
    map<B>(f: (a: A) => B): Result<B, E> {
      return map<A, E, B>(f)(this)
    },
    andThen<B, EE>(f: (a: A) => Result<B, EE>): Result<B, E | EE> {
      return andThen<A, E, B, EE>(f)(this)
    },
    errorMap<EE>(f: (e: E) => EE): Result<A, EE> {
      return errorMap<A, E, EE>(f)(this)
    },
    merge(): A | E {
      return value
    },
    recover<AA, EE>(_f: (e: E) => Result<AA, EE>): Result<A | AA, E | EE> {
      return success(value)
    },
    fold<T>(onSuccess: (a: A) => T, _onError: (e: E) => T): T {
      return onSuccess(value)
    },
  }
}

/** Creates a failed Result. */
export function failure<A, E>(error: E): Result<A, E> {
  return {
    _tag: 'failure',
    error,
    map<B>(f: (a: A) => B): Result<B, E> {
      return map<A, E, B>(f)(this)
    },
    andThen<B, EE>(f: (a: A) => Result<B, EE>): Result<B, E | EE> {
      return andThen<A, E, B, EE>(f)(this)
    },
    errorMap<EE>(f: (e: E) => EE): Result<A, EE> {
      return errorMap<A, E, EE>(f)(this)
    },
    merge(): A | E {
      return error
    },
    recover<AA, EE>(f: (e: E) => Result<AA, EE>): Result<A | AA, E | EE> {
      return f(error)
    },
    fold<T>(_onSuccess: (a: A) => T, onError: (e: E) => T): T {
      return onError(error)
    },
  }
}

/** Extracts either the success value or error from a Result. */
export function merge<A, E>(result: Result<A, E>): A | E {
  return result.merge()
}

/** Curried variant of `result.fold`. */
export function fold<A, E, T>(onSuccess: (a: A) => T, onError: (e: E) => T) {
  return (result: Result<A, E>) => {
    return result.fold(onSuccess, onError)
  }
}

/** Curried variant of `result.errorMap`. */
export function errorMap<A, E, EE>(f: (e: E) => EE) {
  return (result: Result<A, E>) => {
    switch (result._tag) {
      case 'failure': {
        return failure<A, EE>(f(result.error))
      }
      case 'success': {
        return success<A, EE>(result.value)
      }
    }
  }
}
