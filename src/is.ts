import * as E from './error'

export class Is {
  public static missingFields<T>(
    result: E.Result<T>
  ): result is E.MissingFields {
    if ('TAG' in result) {
      return result.TAG === E.MISSING_FIELDS
    }
    return false
  }

  public static result<T>(result: E.Result<T>): result is T {
    return !Is.missingFields(result)
  }
}
