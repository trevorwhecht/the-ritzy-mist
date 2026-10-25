import { repeatToMin } from './repeatToMin'

describe('repeatToMin', () => {
  it('returns the same array when already at or above min', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(repeatToMin(items, 4)).toBe(items)
    const four = ['a', 'b', 'c', 'd']
    expect(repeatToMin(four, 4)).toBe(four)
  })

  it('returns an empty array unchanged', () => {
    const empty: string[] = []
    expect(repeatToMin(empty, 4)).toBe(empty)
  })

  it('repeats whole copies in order until at least min', () => {
    expect(repeatToMin(['a'], 4)).toEqual(['a', 'a', 'a', 'a'])
    expect(repeatToMin(['a', 'b'], 4)).toEqual(['a', 'b', 'a', 'b'])
    expect(repeatToMin(['a', 'b', 'c'], 4)).toEqual(['a', 'b', 'c', 'a', 'b', 'c'])
  })
})
