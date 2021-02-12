import * as AWS from 'aws-sdk'
import { getPrefix, getReader } from './reader'
import { read } from './reader2'

type Type<T> = new (...args: any[]) => T

export async function getConfig<TConfig extends object>(target: Type<TConfig>) {
  const client = new AWS.SSM({
    endpoint: process.env.SSM_ENDPOINT,
  })

  const prefix = getPrefix(target)
  const raw = await client
    .getParametersByPath({ Path: prefix, WithDecryption: true })
    .promise()
  const reader = getReader<TConfig>(target)
  return reader(raw.Parameters)
}

export async function getConfig2<TConfig>(spec: TConfig, prefix: string) {
  const client = new AWS.SSM({
    endpoint: process.env.SSM_ENDPOINT,
  })

  const raw = await client
    .getParametersByPath({ Path: prefix, WithDecryption: true })
    .promise()

  return read(spec, prefix, raw.Parameters)
}
