const DEFAULT_CHUNK_SIZE = 50

/**
 * Split statement text into line-based chunks so long statements stay within a
 * comfortable prompt size. Blank lines are kept (they cost nothing and keep
 * line numbers in error messages meaningful) but a chunk made of only blank
 * lines is dropped.
 */
export function chunkLines(text: string, size: number = DEFAULT_CHUNK_SIZE): string[] {
  const lines = text.split(/\r\n|\r|\n/)
  const chunks: string[] = []

  for (let start = 0; start < lines.length; start += size) {
    const chunk = lines.slice(start, start + size).join('\n')
    if (chunk.trim().length > 0) chunks.push(chunk)
  }

  return chunks
}
