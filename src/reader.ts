import 'reflect-metadata'

import * as E from './error'

const ns = 'confgasm'
const key = name => Symbol(`${ns}:${name}`)
const READER = key('reader')
const PREFIX = key('prefix')
const MEMBERS = key('members')
const NAMING_CONVENTION = key('naming_convention')

type Type<T> = new (...args: any[]) => T

function readRawData(members, parameters) {
  const result = {}

  for (const p of parameters) {
    const reader = members[p.Name]
    if (reader === undefined) continue
    result[reader.name] = reader.parser(p.Value)
  }

  const missing = []
  for (const k of Object.getOwnPropertyNames(members)) {
    const member = members[k]
    if (result[member.name] === undefined) {
      if (member.default !== undefined) {
        result[member.name] = member.default
        continue
      }
      if (member.optional) continue
      missing.push(member.name)
    }
  }

  if (missing.length > 0) {
    return new E.MissingFields(missing)
  }
  return result
}

const identity = {
  fromKey: (s: string) => s,
  toKey: (s: string) => s,
}

export function store<T extends new (...args: any[]) => {}>(
  path?: string,
  { naming } = { naming: identity }
) {
  let prefix = path || '/'
  prefix = (prefix.endsWith('/') && prefix) || prefix + '/'

  return (f: T) => {
    const members = Reflect.getOwnMetadata(MEMBERS, f) || {}
    const readers = {}
    for (const p of Object.getOwnPropertyNames(members)) {
      const paramName = naming.toKey(p)
      readers[`${prefix}${paramName}`] = members[p]
    }
    Reflect.defineMetadata(PREFIX, prefix, f)
    Reflect.defineMetadata(READER, params => readRawData(readers, params), f)
  }
}

function parseBoolean(s: string) {
  if (s === undefined) {
    return false
  }
  const upper = s.toUpperCase()
  if (upper === 'FALSE' || upper === 'NO' || upper === '0') {
    return false
  }
  return Boolean(s)
}

function readerFor(t: any) {
  switch (t) {
    case String:
      return s => s
    case Number:
      return s => parseInt(s, 10)
    case Boolean:
      return s => parseBoolean(s)
  }
}

interface IParameterOptions<T> {
  optional?: boolean
  default?: T
}

export function param<T>(options: IParameterOptions<T> = {}) {
  return (target: any, property: string) => {
    const t = Reflect.getMetadata('design:type', target, property)
    const members = Reflect.getOwnMetadata(MEMBERS, target.constructor) || {}
    members[property] = {
      name: property,
      parser: readerFor(t),
      ...options,
    }
    Reflect.defineMetadata(MEMBERS, members, target.constructor)
  }
}

export function getReader<TConfig>(
  target: Type<any>
): (params: AWS.SSM.ParameterList) => E.Result<TConfig> {
  return Reflect.getOwnMetadata(READER, target)
}

export function getPrefix(target: Type<any>) {
  return Reflect.getOwnMetadata(PREFIX, target)
}
