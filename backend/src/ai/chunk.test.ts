import { describe, expect, it } from 'vitest'
import { chunkLines } from './chunk.js'

describe('chunkLines', () => {
  it('returns a single chunk for short input', () => {
    const text = ['a', 'b', 'c'].join('\n')
    expect(chunkLines(text)).toEqual([text])
  })

  it('splits into groups of the given size', () => {
    const lines = Array.from({ length: 12 }, (_, i) => `line ${i}`)
    const chunks = chunkLines(lines.join('\n'), 5)

    expect(chunks).toHaveLength(3)
    expect(chunks[0]!.split('\n')).toHaveLength(5)
    expect(chunks[1]!.split('\n')).toHaveLength(5)
    expect(chunks[2]!.split('\n')).toHaveLength(2)
  })

  it('defaults to 50-line chunks', () => {
    const lines = Array.from({ length: 110 }, (_, i) => `line ${i}`)
    const chunks = chunkLines(lines.join('\n'))

    expect(chunks).toHaveLength(3)
    expect(chunks[0]!.split('\n')).toHaveLength(50)
    expect(chunks[2]!.split('\n')).toHaveLength(10)
  })

  it('drops chunks that are only blank lines', () => {
    const text = `a\nb\n\n   \n`
    expect(chunkLines(text, 2)).toEqual(['a\nb'])
  })

  it('returns no chunks for empty input', () => {
    expect(chunkLines('')).toEqual([])
    expect(chunkLines('   \n  \n')).toEqual([])
  })
})
