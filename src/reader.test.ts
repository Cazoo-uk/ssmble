import { MissingFields, Result } from './error'
import { Is } from './is'
import { getReader, param, store } from './reader'

function shouldBe<T>(fn: (t1) => t1 is T, t): T {
  if (fn(t)) {
    return t
  }
  throw new Error('Expected a thing to be a different thing')
}

const p = (name: string, value: string) => ({
    ARN: 'big-long-string',
    LastModifiedDate: new Date(),
  Name: name,
  Type: 'String',
  Value: value,
  Version: 1,
})

describe('when building a result object', () => {
  @store('/service/trevoror')
  class Config {
    @param()
    public email: string
    @param()
    public age: number
    @param()
    public isExcellent: boolean
  }

  const input = [
    p('/service/trevoror/email', 'winning@life.com'),
    p('/service/trevoror/age', '22'),
    p('/service/trevoror/isExcellent', 'true'),
  ]

  it('should return the correct types', () => {
    const builder = getReader<Config>(Config)
    const result = builder(input)
    expect(result).toEqual({
        age: 22,
      email: 'winning@life.com',
      isExcellent: true,
    })
  })
})

describe('when the parameters list contains extra elements', () => {
  @store('/foo')
  class Config {
    @param()
    public email: string
  }

  const input = [p('/foo/email', 'winning@life.com'), p('/foo/age', '22')]

  it('should return the correct types', () => {
    const builder = getReader<Config>(Config)
    const result = builder(input)
    expect(result).toEqual({
      email: 'winning@life.com',
    })
  })
})

describe('when there are values missing in the response', () => {
  @store('/missing-fields')
  class Config {
    @param()
    public email: string
    @param()
    public isExcellent: boolean
  }

  const input = [p('/missing-fields/age', '22')]

  it('should return an error for the missing config keys', () => {
    const builder = getReader<Config>(Config)
    const result = shouldBe<MissingFields>(Is.missingFields, builder(input))
    expect(result.fields).toEqual(['email', 'isExcellent'])
  })
})

describe('When a field is explicitly optional', () => {
  @store('/missing-fields')
  class Config {
    @param({ optional: true })
    public email?: string

    @param({ optional: true })
    public isExcellent?: boolean

    @param()
    public age: number
  }

  let result: Config
  const input = [p('/missing-fields/age', '22')]

  beforeEach(() => {
    const builder = getReader<Config>(Config)
    result = shouldBe<Config>(Is.result, builder(input))
  })

  it('should return undefined for the missing fields', () => {
    expect(result.email).toBeUndefined()
    expect(result.isExcellent).toBeUndefined()
  })

  it('should return values for the present fields', () => {
    expect(result.age).toEqual(22)
  })
})

describe('When a field has a default value', () => {
  @store('/default-fields')
  class Config {
    @param({ default: 'fizz@buzz.org' })
    public email: string

    @param({ default: 27 })
    public age: number
  }

  let result: Config
  const input = [p('/default-fields/age', '99')]

  beforeEach(() => {
    const builder = getReader<Config>(Config)
    result = shouldBe<Config>(Is.result, builder(input))
  })

  it('should return undefined for the missing fields', () => {
    expect(result.email).toEqual('fizz@buzz.org')
  })

  it('should return values for the present fields', () => {
      expect(result.age).toEqual(99)
  })
})
