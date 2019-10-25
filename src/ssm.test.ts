import { Ssm } from './ssm'
import * as AWS from 'aws-sdk'
import * as http from 'http'

describe('The simplest possible config object', () => {
  let server: http.Server
  let requestedPath: string

  class MyConfig {
    secretKey: string
  }

  function startLocalServer() {
    return new Promise((resolve, reject) => {
      server = http
        .createServer((req, res) => {
          let body = ''
          req.on('data', chunk => (body += chunk))
          req.on('end', () => {
            const parsed = JSON.parse(body)
            requestedPath = parsed.Path
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(
              JSON.stringify({
                Parameters: [
                  {
                    Name: 'foo',
                    Type: 'String',
                    Value: 'hello world',
                    Version: 1,
                    LastModifiedDate: 1569487706.775,
                    ARN: 'big-long-string',
                  },
                ],
              })
            )
            res.end()
          })
        })
        .listen({ port: 3214 }, resolve)
    })
  }

  beforeEach(async () => {
    process.env.SSM_ENDPOINT = 'http://localhost:3214/ssm'
    process.env.AWS_REGION = 'eu-west-1'
    await startLocalServer()
  })

  afterEach(() => {
    delete process.env.SSM_ENDPOINT
    return new Promise((resolve, reject) => {
      server.close(resolve)
    })
  })

  describe('When we try to build the configuration', () => {
    it('should request the correct path', async () => {
      await getConfig<MyConfig>()
      expect(requestedPath).toEqual('/')
    })
  })

  describe('When we provide a path prefix', () => {
    it('should prepend the prefix to the requested path', async () => {
      await getConfig<MyConfig>('/operations/foo')
      expect(requestedPath).toEqual('/operations/foo/')
    })
  })
})

async function getConfig<TConfig>(prefix?: string) {
  const client = new AWS.SSM({
    endpoint: process.env.SSM_ENDPOINT,
    logger: console,
  })

  return await client.getParametersByPath({ Path: '/' }).promise()
}
