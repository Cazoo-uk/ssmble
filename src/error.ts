export const MISSING_FIELDS = Symbol('MISSING_FIELDS')

export class MissingFields {
  public TAG = MISSING_FIELDS
  public fields: string[]

  constructor(fields: string[]) {
    this.fields = fields
  }
}

export type Error = MissingFields

export type Result<T> = T | Error
