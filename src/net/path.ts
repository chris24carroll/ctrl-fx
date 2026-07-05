export type Path = {
  readonly elems: readonly string[]
  format(): string
  matches(that: Path): boolean
}

export const emptyPath = {
  elems: [],
  format() {
    return ''
  },
  matches(that: Path): boolean {
    return that.elems.length === 0
  },
}

export function parsePath(s: string): Path {
  return {
    elems: s.split('/'),
    format() {
      return this.elems.join('/')
    },
    matches(that: Path): boolean {
      if (this.elems.length !== that.elems.length) {
        return false
      }

      for (let i = 0; i < this.elems.length; i++) {
        if (
          this.elems[i].toLocaleLowerCase() !==
          that.elems[i].toLocaleLowerCase()
        ) {
          return false
        }
      }

      return true
    },
  }
}
