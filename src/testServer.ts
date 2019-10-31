import { SSM } from 'aws-sdk'
import * as http from 'http'

export function startLocalServer(
  callback: (path: string) => void,
  params: SSM.ParameterList
): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http
      .createServer((req, res) => {
        let body = ''
        req.on('data', chunk => (body += chunk))
        req.on('end', () => {
          const parsed = JSON.parse(body)
          callback(parsed.Path)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify({ Parameters: params }))
          res.end()
        })
      })
      .listen({ port: 3214 }, () => resolve(server))
  })
}
