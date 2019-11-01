type PropertyName = string
type Key = string

interface INameKeys {
  fromKey: (key: Key) => PropertyName
  toKey: (name: PropertyName) => Key
}

export const Kebab = {
  fromKey: (key: Key): PropertyName => {
    return key.replace(/([-][a-z])/gi, $1 => {
      return $1[1].toUpperCase()
    })
  },

  toKey: (name: PropertyName): Key => {
    return name.replace(/[A-Z]/g, $1 => {
      return `-${$1.toLowerCase()}`
    })
  },
}

export const Snake = {
  fromKey: (key: Key): PropertyName => {
    return key.replace(/([_][a-z])/gi, $1 => {
      return $1[1].toUpperCase()
    })
  },

  toKey: (name: PropertyName): Key => {
    return name.replace(/[A-Z]/g, $1 => {
      return `_${$1.toLowerCase()}`
    })
  },
}
