import { todo } from '../utils'
import { emptyPath, parsePath, type Path } from './path'
import type { QueryParam } from './queryparam'

export interface Fragment {
  path: Path
  queryParams: QueryParam[]
  format: string
}

export const emptyFragment: Fragment = {
  path: emptyPath,
  queryParams: [],
  format: '',
}

export function parseFragment(str: string): Fragment | undefined {
  const normalizedInput = (str.startsWith('#') ? str.substring(1) : str).trim()
  if (normalizedInput.length === 0) {
    return
  }

  const questionMark = normalizedInput.indexOf('?')
  if (questionMark <= -1) {
    return {
      path: parsePath(normalizedInput),
      queryParams: [],
      format: normalizedInput,
    }
  } else {
    return todo()
  }
}
//def format: String =
//s"#${path.format}${QueryParam.format(queryParams.params)}"

//def pathAndParams: PathAndParams = PathAndParams(path, queryParams)
