import * as AWS from 'aws-sdk'
import * as http from 'http'
import { Is } from './is'
import { getPrefix, getReader, param, store } from './reader'
import { Unwrapped, cfg } from './reader2'
import { getConfig, getConfig2 } from './ssm'
import { startLocalServer } from './testServer'
import { shouldBe } from './testUtil'

type Type<T> = new (...args: any[]) => T

@store('/operations/foo')
class MyConfig {
  @param()
  public secretKey: string
}

const p = (name: string, value: string) => ({
  Name: name,
  Type: 'String',
  Value: value,
  Version: 1,
  LastModifiedDate: new Date(),
  ARN: 'big-long-string',
})

describe('The simplest possible config object', () => {
  let server: http.Server
  let requestedPath: Promise<string>

  beforeEach(async () => {
    process.env.SSM_ENDPOINT = 'http://localhost:3214/ssm'
    process.env.AWS_REGION = 'eu-west-1'
    process.env.AWS_ACCESS_KEY_ID = 'foo'
    process.env.AWS_SECRET_ACCESS_KEY = 'bar'
    let resolver: (path: string) => void
    requestedPath = new Promise((resolve, reject) => {
      resolver = resolve
    })
    server = await startLocalServer(resolver, [
      p('/operations/foo/secretKey', 'hello-world'),
    ])
  })

  afterEach(done => {
    delete process.env.SSM_ENDPOINT
    server.close(done)
  })

  describe('When we provide a path prefix', () => {
    it('should prepend the prefix to the requested path', async () => {
      const cfg = shouldBe<MyConfig>(Is.result, await getConfig(MyConfig))
      expect(await requestedPath).toEqual('/operations/foo/')
      expect(cfg.secretKey).toEqual('hello-world')
    })
  })
})

describe('The new reader', () => {
  let server: http.Server
  let requestedPath: Promise<string>

  let spec = {
    foo: {
      secretKey: cfg.str(),
    },
  }

  beforeEach(async () => {
    process.env.SSM_ENDPOINT = 'http://localhost:3214/ssm'
    process.env.AWS_REGION = 'eu-west-1'
    process.env.AWS_ACCESS_KEY_ID = 'foo'
    process.env.AWS_SECRET_ACCESS_KEY = 'bar'
    let resolver: (path: string) => void
    requestedPath = new Promise((resolve, reject) => {
      resolver = resolve
    })
    server = await startLocalServer(resolver, [
      p('/operations/foo/secretKey', 'hello-world'),
    ])
  })

  afterEach(done => {
    delete process.env.SSM_ENDPOINT
    server.close(done)
  })

  describe('When we provide a path prefix', () => {
    it('should prepend the prefix to the requested path', async () => {
      const cfg = shouldBe<Unwrapped<typeof spec>>(
        Is.result,
        await getConfig2(spec, '/operations')
      )
      expect(await requestedPath).toEqual('/operations')
      expect(cfg.foo.secretKey).toEqual('hello-world')
    })
  })
})
