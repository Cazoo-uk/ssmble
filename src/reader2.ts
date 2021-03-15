import { MissingFields, Result } from './error'

type Reader<TResult> = (
  key: string,
  p: AWS.SSM.Parameter,
  missing: string[]
) => TResult | undefined

export type Unwrapped<T> = {
  [P in keyof T]: T[P] extends Reader<infer R>
    ? R
    : T[P] extends string
    ? string
    : T[P] extends number
    ? number
    : T[P] extends boolean
    ? boolean
    : Unwrapped<T[P]>
}

interface IParamOpts<T> {
  default?: T
}

function parseBoolean(s: string) {
  if (s === undefined) {
    return false
  }
  const upper = s.toUpperCase()
  if (upper === 'FALSE' || upper === 'NO' || upper === '0') {
    return false
  }
  return Boolean(s)
}

function _maybeR<T>(parse: (v: string) => T, opts: IParamOpts<T>) {
  return (key: string, x: AWS.SSM.Parameter | undefined, missing: string[]) => {
    if (undefined === x) {
      return opts.default
    } else {
      return parse(x.Value)
    }
  }
}

function _r<T>(parse: (v: string) => T) {
  return (key: string, x: AWS.SSM.Parameter | undefined, missing: string[]) => {
    if (undefined === x) {
      missing.push(key)
      return
    } else {
      return parse(x.Value)
    }
  }
}

const cfg = {
  bool: () => _r(parseBoolean),
  int: () => _r(x => parseInt(x, 10)),
  maybeBool: (opts: IParamOpts<boolean> = {}) => _maybeR(parseBoolean, opts),
  maybeInt: (opts: IParamOpts<number> = {}) =>
    _maybeR(x => parseInt(x, 10), opts),
  maybeStr: (opts: IParamOpts<string> = {}) => _maybeR(x => x, opts),
  str: () => _r(x => x),
}

export function read<T>(
  spec: T,
  initialPrefix: string,
  input: AWS.SSM.ParameterList
): Result<Unwrapped<T>> {
  const stack = []
  const result = {}
  const data = Object.assign({}, ...input.map(p => ({ [p.Name]: p })))

  if (initialPrefix.substr(-1) !== '/') initialPrefix += '/'
  const missing = []

  stack.push([result, initialPrefix, spec])

  while (stack.length > 0) {
    const [target, prefix, template] = stack.pop()

    for (const key of Object.keys(template)) {
      const field = template[key]
      const value = data[prefix + key]

      const fieldType = Object.prototype.toString.call(field)
      if (fieldType === '[object Object]') {
        target[key] = {}
        stack.push([target[key], prefix + key + '/', template[key]])
      } else if (fieldType === '[object Function]') {
        target[key] = field(key, value, missing)
      } else {
        target[key] = field
      }
    }
  }
  if (missing.length > 0) return new MissingFields(missing)
  return result as Unwrapped<T>
}

export { cfg }
