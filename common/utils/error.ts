export function stringifyError(err: any) {
  return 'toString' in err ? err.toString() : typeof err === 'object' ? JSON.stringify(err) : err
}
