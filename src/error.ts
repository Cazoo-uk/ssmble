const MISSING_FIELDS = Symbol('MISSING_FIELDS')

export class MissingFields {
    public __tag = MISSING_FIELDS
    public fields: string[]

    constructor(fields: string[]) {
       this.fields = fields
    }
}

type Error = MissingFields

type Result<T> = T | Error

export function isMissingFields<T>(result: Result<T>) : result is MissingFields {
    if ('__tag' in result) {
    return result.__tag == MISSING_FIELDS
    }
    return false
}

