import * as AWS from 'aws-sdk'
import { getPrefix, getReader } from './reader'

type Type<T> = new (...args: any[]) => T

export async function getConfig<TConfig extends object>(target: Type<TConfig>) {
  const client = new AWS.SSM({
    endpoint: process.env.SSM_ENDPOINT,
  })

  const prefix = getPrefix(target)
  const raw = await client.getParametersByPath({ Path: prefix }).promise()
  const reader = getReader<TConfig>(target)
  return reader(raw.Parameters)
}
