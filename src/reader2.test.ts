import { MissingFields } from './error'
import { Is } from './is'
import { shouldBe } from './testUtil'
import { Unwrapped, read, cfg } from './reader2'

const p = (name: string, value: string) => ({
  ARN: 'big-long-string',
  LastModifiedDate: new Date(),
  Name: name,
  Type: 'String',
  Value: value,
  Version: 1,
})

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

describe('When a field is explicitly optional', () => {
  const spec = {
    email: cfg.maybeStr(),
    isExcellent: cfg.maybeBool(),
    age: cfg.maybeInt(),
  }

  let result: Unwrapped<typeof spec>

  const input = [p('/missing-fields/age', '22')]

  beforeEach(() => {
    const built = read(spec, '/missing-fields', input)
    result = shouldBe<Unwrapped<typeof spec>>(Is.result, built)
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
  const spec = {
    email: cfg.maybeStr({ default: 'fizz@buzz.org' }),
    age: cfg.maybeInt({ default: 42 }),
  }

  let result: Unwrapped<typeof spec>
  const input = []

  beforeEach(() => {
    result = shouldBe<Unwrapped<typeof spec>>(
      Is.result,
      read(spec, '/default-fields/', input)
    )
  })

  it('should return the default for the missing fields', () => {
    expect(result.email).toEqual('fizz@buzz.org')
    expect(result.age).toEqual(42)
  })
})
