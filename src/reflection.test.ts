import { store, param, getReader } from './reader'

const p = (name: string, value: string) => ({
  Name: name,
  Type: 'String',
  Value: value,
  Version: 1,
  LastModifiedDate: new Date(),
  ARN: 'big-long-string',
})

describe('when building a result object', () => {
  @store('/service/trevoror')
  class Config {
    @param
    email: string
    @param
    age: number
    @param
    isExcellent: boolean
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
      email: 'winning@life.com',
      age: 22,
      isExcellent: true,
    })
  })
})

describe('when the parameters list contains extra elements', () => {
  @store('/foo')
  class Config {
    @param
    email: string
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
    @param
    email: string
    @param
    isExcellent: boolean
  }

  const input = [p('/missing-fields/age', '22')]

  it('should throw an error for the missing config keys', () => {
    const builder = getReader<Config>(Config)
    expect(builder(input)).toEqual({
      tag: 'MISSING_FIELDS',
      fields: ['email', 'isExcellent'],
    })
  })
})
