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
type Reader<TResult> = (p:Param) => TResult

const cfg = {
    str: () : Reader<string> => (x: ReturnType<typeof p>) => x.Value,
    int: () : Reader<number> => (x: ReturnType<typeof p>) => parseInt(x.Value),
    bool: () : Reader<boolean> => (x: ReturnType<typeof p>) => parseBoolean(x.Value)
}

describe('when building a result object', () => {

  type Unwrapped<T> = {
      [P in keyof T] : T[P] extends Reader<infer R> ? R : T[P]
  }

  const config = {
      email: cfg.str(),
      age: cfg.int(),
      isExcellent: cfg.bool()
  }

  const input = [
    p('/service/email', 'winning@life.com'),
    p('/service/age', '22'),
    p('/service/isExcellent', 'true'),
  ]

  function poop<T> (spec: T, prefix: string, input: Array<Param>) : Unwrapped<T> {
    let result = {}
    let data = Object.assign({}, ...input.map(p => ({[p.Name]: p})))

    for (const k of Object.keys(spec)) {
      const el = spec[k]
        const entry = data[prefix + k]
      if(typeof el === "function") {
        result[k] = el(entry)
      }
    }

    return result as Unwrapped<T>
  }


  it('should return the correct types', () => {
   const result = poop(config, '/service/', input)
      expect(result).toMatchObject({
          email: 'winning@life.com',
          age: 22,
          isExcellent: true
      })
  })
})
