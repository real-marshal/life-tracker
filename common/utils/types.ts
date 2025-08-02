// gets rid of key names (to differentiate between camel and snake case)
// and turns non-primitives into string (stored as json)
export type Row<T> = Record<
  string,
  T[keyof T] extends string | number | boolean | null | undefined ? T[keyof T] : string
>

// only turns non-primitives into string (stored as json)
export type RowCamelCase<T> = {
  [K in keyof T]: T[K] extends string | number | boolean | null | undefined ? T[K] : string
}
