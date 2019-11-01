import { MissingFields, Result } from './error'
import { Is } from './is'
import * as Naming from './naming'
import { getReader, param, store } from './reader'
import { shouldBe } from './testUtil'

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

  it('should return the default for the missing fields', () => {
    expect(result.email).toEqual('fizz@buzz.org')
  })

  it('should return values for the present fields', () => {
    expect(result.age).toEqual(99)
  })
})

describe('When the store uses kebab-case-identifiers', () => {
  @store('/kebab-case', { naming: Naming.Kebab })
  class Config {
    @param({ default: 'fizz@buzz.org' })
    public customerEmail: string

    @param({ default: 27 })
    public sessionTimeToLive: number
  }

  let result: Config
  const input = [
    p('/kebab-case/customer-email', 'tilting@windmills.net'),
    p('/kebab-case/session-time-to-live', '42'),
  ]

  beforeEach(() => {
    const builder = getReader<Config>(Config)
    result = shouldBe<Config>(Is.result, builder(input))
  })

  it('should return the correct values', () => {
    expect(result.customerEmail).toEqual('tilting@windmills.net')
    expect(result.sessionTimeToLive).toEqual(42)
  })
})

describe('When the store uses snake_case_identifiers', () => {
  @store('/snake-case', { naming: Naming.Snake })
  class Config {
    @param({ default: 'fizz@buzz.org' })
    public customerEmail: string

    @param({ default: 27 })
    public sessionTimeToLive: number
  }

  let result: Config
  const input = [
    p('/snake-case/customer_email', 'tilting@windmills.net'),
    p('/snake-case/session_time_to_live', '42'),
  ]

  beforeEach(() => {
    const builder = getReader<Config>(Config)
    result = shouldBe<Config>(Is.result, builder(input))
  })

  it('should return the correct values', () => {
    expect(result.customerEmail).toEqual('tilting@windmills.net')
    expect(result.sessionTimeToLive).toEqual(42)
  })
})
