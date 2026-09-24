import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chunkLines } from './chunk.js'
import { callModel, type ChatMessage } from './client.js'
import { chunkResponseSchema, extractedTransactionSchema, type ExtractedTransaction } from './schema.js'

const PROMPT_PATH = fileURLToPath(new URL('../../prompts/extract.v1.txt', import.meta.url))
const SYSTEM_PROMPT = readFileSync(PROMPT_PATH, 'utf-8')

export type ParsedTransaction = ExtractedTransaction & { id: string }
export type UnparsedRow = { reason: string; raw?: string }

export type ExtractResult = {
  transactions: ParsedTransaction[]
  unparsed: UnparsedRow[]
}

const MAX_ATTEMPTS = 2

function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed)
  return fenced?.[1] ?? trimmed
}

function logEvent(event: string, data: Record<string, unknown>): void {
  // Structured, metadata-only logging — never the statement text or the
  // model's raw output, which may contain real financial details.
  console.log(JSON.stringify({ event, ...data }))
}

/** Parse and validate one chunk, retrying once (with the validation error fed
 *  back to the model) if its response isn't a usable JSON array. */
async function extractChunk(chunk: string, chunkIndex: number): Promise<ExtractResult> {
  const messages: ChatMessage[] = [{ role: 'user', content: chunk }]

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const call = await callModel(SYSTEM_PROMPT, messages)

    logEvent('import.chunk.call', {
      chunk: chunkIndex,
      attempt,
      latencyMs: call.latencyMs,
      inputTokens: call.inputTokens,
      outputTokens: call.outputTokens,
    })

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(stripCodeFence(call.text))
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        messages.push({ role: 'assistant', content: call.text })
        messages.push({
          role: 'user',
          content: 'That was not valid JSON. Reply again with ONLY a JSON array — no other text.',
        })
        continue
      }
      logEvent('import.chunk.failed', { chunk: chunkIndex, reason: 'invalid-json' })
      return {
        transactions: [],
        unparsed: [{ reason: `Section ${chunkIndex + 1}: the model did not return valid JSON.` }],
      }
    }

    const shape = chunkResponseSchema.safeParse(parsedJson)
    if (!shape.success) {
      if (attempt < MAX_ATTEMPTS) {
        messages.push({ role: 'assistant', content: call.text })
        messages.push({
          role: 'user',
          content: `That response was not a JSON array (${shape.error.message}). Reply again with ONLY a JSON array of transaction objects.`,
        })
        continue
      }
      logEvent('import.chunk.failed', { chunk: chunkIndex, reason: 'invalid-shape' })
      return {
        transactions: [],
        unparsed: [{ reason: `Section ${chunkIndex + 1}: the model's response was not a JSON array.` }],
      }
    }

    const transactions: ParsedTransaction[] = []
    const unparsed: UnparsedRow[] = []

    for (const item of shape.data) {
      const row = extractedTransactionSchema.safeParse(item)
      if (row.success) {
        transactions.push({ ...row.data, id: randomUUID() })
      } else {
        unparsed.push({
          reason: row.error.issues.map(issue => issue.message).join('; '),
          raw: JSON.stringify(item),
        })
      }
    }

    if (unparsed.length > 0) {
      logEvent('import.chunk.rowsRejected', { chunk: chunkIndex, count: unparsed.length })
    }

    return { transactions, unparsed }
  }

  // Unreachable — the loop always returns by MAX_ATTEMPTS — but keeps TS happy.
  return { transactions: [], unparsed: [] }
}

/** Extract transactions from a full statement, chunked and processed in parallel. */
export async function extractTransactions(statementText: string): Promise<ExtractResult> {
  const chunks = chunkLines(statementText)
  const results = await Promise.all(chunks.map(extractChunk))

  return results.reduce<ExtractResult>(
    (acc, result) => ({
      transactions: [...acc.transactions, ...result.transactions],
      unparsed: [...acc.unparsed, ...result.unparsed],
    }),
    { transactions: [], unparsed: [] },
  )
}
