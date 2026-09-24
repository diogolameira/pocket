import type { ImportRepository, ParseResult } from '../../application/importRepository'
import { apiRequest } from './apiClient'

const ENDPOINT = '/api/import/parse'

/** HTTP adapter for the `ImportRepository` port. */
export const httpImportRepository: ImportRepository = {
  parse: text => apiRequest<ParseResult>(ENDPOINT, { method: 'POST', body: JSON.stringify({ text }) }),
}
