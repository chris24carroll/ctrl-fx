export interface SupportsApply {
  apply(f: (t: this) => this): this
  applyIf(condition: boolean, f: (self: this) => this): this
}

export function applySupport<T>() {
  return {
    apply(this: T, f: (t: T) => T) {
      return f(this)
    },
    applyIf(this: T, condition: boolean, f: (t: T) => T) {
      return condition ? f(this) : this
    },
  }
}
