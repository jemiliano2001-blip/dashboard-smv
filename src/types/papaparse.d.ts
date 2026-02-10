declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[]
    errors: Array<{ message: string }>
  }
  export function parse<T>(input: string, config: { header: true; skipEmptyLines: boolean }): ParseResult<T>
}
