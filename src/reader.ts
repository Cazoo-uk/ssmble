import 'reflect-metadata'

const ns = 'confgasm'
const key = name => Symbol(`${ns}:${name}`)
const READER = key('reader')
const MEMBERS = key('members')

interface Type<T> {
  new (...args: any[]): T
}

interface Property<T> {
  parser: (x: string) => T
  name: string
}

function readRawData(members, parameters) {
  const result = {}
  for (const param of parameters) {
    const reader = members[param.Name]
    if (reader === undefined) continue
    result[reader.name] = reader.parser(param.Value)
  }
  return result
}

export function store<T extends { new (...args: any[]): {} }>(path?: string) {
  let prefix = path || '/'
  prefix = (prefix.endsWith('/') && prefix) || prefix + '/'

  return (f: T) => {
    const members = Reflect.getOwnMetadata(MEMBERS, f) || {}
    const readers = {}
    for (const p of Object.getOwnPropertyNames(members)) {
      readers[`${prefix}${p}`] = members[p]
    }
    Reflect.defineMetadata(READER, params => readRawData(readers, params), f)
  }
}

function readerFor(t: any) {
  switch (t) {
    case String:
      return s => s
    case Number:
      return s => parseInt(s)
  }
}

export function param(target: any, property: string) {
  var t = Reflect.getMetadata('design:type', target, property)
  const members = Reflect.getOwnMetadata(MEMBERS, target.constructor) || {}
  members[property] = {
    parser: readerFor(t),
    name: property,
  }
  Reflect.defineMetadata(MEMBERS, members, target.constructor)
}

export function getReader<TConfig>(
  target: Type<any>
): (params: AWS.SSM.ParameterList) => TConfig {
  return Reflect.getOwnMetadata(READER, target)
}
