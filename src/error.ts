const MISSING_FIELDS = Symbol('MISSING_FIELDS')

export class MissingFields {
    public __tag = MISSING_FIELDS
    public fields: string[]

    constructor(fields: string[]) {
       this.fields = fields
    }
}

export type Error = MissingFields

export type Result<T> = T | Error

export namespace is {
    export function missingFields<T>(result: Result<T>) : result is MissingFields {
        if ('__tag' in result) {
            return result.__tag == MISSING_FIELDS
        }
        return false
    }

    export function result<T>(result: Result<T>) : result is T {
        return ! is.missingFields(result)
    }
}

