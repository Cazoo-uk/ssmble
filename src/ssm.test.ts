import { Ssm } from './ssm'
import * as AWS from 'aws-sdk'
import * as http from 'http'
import { startLocalServer } from './testServer'
import { getReader, getPrefix, store, param } from './reader'

interface Type<T> {
  new (...args: any[]): T
}

@store('/operations/foo')
class MyConfig {
  @param
  secretKey: string
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
      const cfg = await getConfig(MyConfig)
      expect(await requestedPath).toEqual('/operations/foo/')
      expect(cfg.secretKey).toEqual('hello-world')
    })
  })
})

async function getConfig<TConfig extends object>(target: Type<TConfig>) {
  const client = new AWS.SSM({
    endpoint: process.env.SSM_ENDPOINT,
    logger: console,
  })

  const prefix = getPrefix(target)
  const raw = await client.getParametersByPath({ Path: prefix }).promise()
  const reader = getReader<TConfig>(target)
  return reader(raw.Parameters)
}
