import { MissingFields, Result } from './error'
import { Is } from './is'
import { shouldBe } from './testUtil'

const p = (name: string, value: string) => ({
  ARN: 'big-long-string',
  LastModifiedDate: new Date(),
  Name: name,
  Type: 'String',
  Value: value,
  Version: 1,
})

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

type Param = ReturnType<typeof p>
type Reader<TResult> = (p: Param) => TResult

type Unwrapped<T> = {
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

function read<T>(
  spec: T,
  prefix: string,
  input: Array<Param>
): Result<Unwrapped<T>> {
  let result = {}
  let data = Object.assign({}, ...input.map(p => ({ [p.Name]: p })))

  if (prefix.substr(-1) != '/') prefix += '/'
  const missing = []

  function _read(template, result, prefix, data, missing) {
    for (const key of Object.keys(template)) {
      const field = template[key]
      const value = data[prefix + key]

      const _type = Object.prototype.toString.call(field)
      if (_type === '[object Object]') {
        result[key] = _read(
          template[key],
          {},
          prefix + key + '/',
          data,
          missing
        )
      } else if (undefined === value) {
        missing.push(key)
      } else if (_type === '[object Function]') {
        result[key] = field(value)
      } else {
        result[key] = field
      }
    }
    return result
  }

  result = _read(spec, {}, prefix, data, missing)
  if (missing.length > 0) return new MissingFields(missing)

  return result as Unwrapped<T>
}

const cfg = {
  str: (): Reader<string> => (x: ReturnType<typeof p>) => x.Value,
  int: (): Reader<number> => (x: ReturnType<typeof p>) => parseInt(x.Value),
  bool: (): Reader<boolean> => (x: ReturnType<typeof p>) =>
    parseBoolean(x.Value),
}

describe('when building a result object', () => {
  const config = {
    email: cfg.str(),
    age: cfg.int(),
    isExcellent: cfg.bool(),
  }

  const input = [
    p('/service/email', 'winning@life.com'),
    p('/service/age', '22'),
    p('/service/isExcellent', 'true'),
  ]

  it('should return the correct types', () => {
    const result = read(config, '/service/', input)
    expect(result).toMatchObject({
      email: 'winning@life.com',
      age: 22,
      isExcellent: true,
    })
  })
})

describe('when building a nested result', () => {
  const config = {
    stripe: {
      blockListId: cfg.str(),
    },
    truelayer: {
      clientId: cfg.str(),
    },
  }

  const input = [
    p('/payments/stripe/blockListId', 'foo'),
    p('/payments/truelayer/clientId', 'bar'),
  ]

  it('should return the correct types', () => {
    const result = read(config, '/payments/', input)
    expect(result).toMatchObject({
      stripe: {
        blockListId: 'foo',
      },
      truelayer: {
        clientId: 'bar',
      },
    })
  })
})

describe('when the parameters list contains extra elements', () => {
  const spec = {
    email: cfg.str(),
  }

  const input = [p('/foo/email', 'winning@life.com'), p('/foo/age', '22')]

  it('should return the correct types', () => {
    const result = read(spec, '/foo', input)
    expect(result).toEqual({
      email: 'winning@life.com',
    })
  })
})

describe('when there are values missing in the response', () => {
  const spec = {
    email: cfg.str(),
    isExcellent: cfg.bool(),
  }

  const input = [p('/missing-fields/age', '22')]

  it('should return an error for the missing config keys', () => {
    const built = read(spec, '/missing-fields', input)
    const result = shouldBe<MissingFields>(Is.missingFields, built)
    expect(result.fields).toEqual(['email', 'isExcellent'])
  })
})
