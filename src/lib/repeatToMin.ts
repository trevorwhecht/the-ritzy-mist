// Repeats the whole list in order until it has at least `min` items. Empty or long-enough lists come back unchanged.
export function repeatToMin<T>(items: T[], min: number): T[] {
  if (items.length === 0 || items.length >= min) return items
  const out: T[] = []
  while (out.length < min) out.push(...items)
  return out
}
