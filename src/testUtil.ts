export function shouldBe<T>(fn: (t1: any) => t1 is T, t: any): T {
  if (fn(t)) {
    return t
  }
  throw new Error('Expected a thing to be a different thing')
}
