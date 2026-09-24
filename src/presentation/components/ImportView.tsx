import { useState, type ChangeEvent } from 'react'
import { categories, type Category, type NewExpense } from '../../domain/expense'
import type { ImportRepository } from '../../application/importRepository'
import { useStatementImport } from '../../application/useStatementImport'

type ImportViewProps = {
  repository: ImportRepository
  onSaveExpense: (expense: NewExpense) => Promise<void>
}

export function ImportView({ repository, onSaveExpense }: ImportViewProps) {
  const importState = useStatementImport(repository, onSaveExpense)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const showForm = importState.status === 'idle' || importState.status === 'parsing' || importState.status === 'error'

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setFileError(null)
    try {
      setText(await file.text())
      setFileName(file.name)
    } catch {
      setFileError('Could not read that file.')
    }
  }

  function handleStartOver() {
    importState.reset()
    setText('')
    setFileName(null)
    setFileError(null)
  }

  return (
    <section className="section-block import-view">
      {showForm ? (
        <>
          <div className="section-heading">
            <div>
              <h2>Import a statement</h2>
              <p>Paste your bank statement text, or upload a CSV export. We'll extract the transactions for you to review before anything is saved.</p>
            </div>
          </div>

          {importState.parseError && (
            <div className="banner error" role="alert"><span>{importState.parseError}</span></div>
          )}
          {fileError && <div className="banner error" role="alert"><span>{fileError}</span></div>}

          <div className="import-intro">
            <textarea
              className="import-textarea"
              value={text}
              onChange={event => { setText(event.target.value); setFileName(null) }}
              placeholder="Paste statement text here…"
              rows={12}
            />
            <div className="import-toolbar">
              {fileName && <span className="import-filename">Loaded {fileName}</span>}
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                id="import-file"
                className="sr-only"
                onChange={event => void handleFileChange(event)}
              />
              <label htmlFor="import-file" className="secondary-button">Upload CSV</label>
              <button
                className="primary-button"
                onClick={() => void importState.parse(text)}
                disabled={!text.trim() || importState.status === 'parsing'}
              >
                {importState.status === 'parsing' ? 'Parsing…' : 'Parse statement'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <h2>Review import</h2>
              <p>
                {importState.rows.length} transaction{importState.rows.length === 1 ? '' : 's'} found
                {importState.unparsed.length > 0 ? `, ${importState.unparsed.length} could not be parsed` : ''}.
              </p>
            </div>
            <button className="text-button" onClick={handleStartOver}>Start over</button>
          </div>

          {importState.rows.length > 0 ? (
            <>
              <p className="import-hint">
                Amounts are shown as they appear on your statement — negative for money out, positive (green) for money in.
              </p>
              <div className="table-wrap review-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={importState.rows.every(row => row.selected)}
                          onChange={event => importState.toggleAll(event.target.checked)}
                          aria-label="Select all"
                        />
                      </th>
                      <th>Date</th>
                      <th>Merchant</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {importState.rows.map(row => (
                      <tr key={row.id} className={row.status === 'error' ? 'review-row-error' : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => importState.toggleRow(row.id)}
                            aria-label={`Include ${row.merchant}`}
                          />
                        </td>
                        <td>
                          <input
                            className="review-input"
                            type="date"
                            value={row.date}
                            onChange={event => importState.updateRow(row.id, { date: event.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="review-input"
                            type="text"
                            value={row.merchant}
                            onChange={event => importState.updateRow(row.id, { merchant: event.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="review-input"
                            value={row.category}
                            onChange={event => importState.updateRow(row.id, { category: event.target.value as Category })}
                          >
                            {categories.map(category => <option key={category}>{category}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className={row.amount > 0 ? 'review-input review-amount positive' : 'review-input review-amount'}
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={event => importState.updateRow(row.id, { amount: Number(event.target.value) })}
                          />
                        </td>
                        <td className="row-actions">
                          {row.status === 'saving' && <span className="row-status">Saving…</span>}
                          {row.status === 'error' && <span className="row-status error" title={row.error}>Failed</span>}
                          <button
                            className="row-action delete"
                            onClick={() => importState.removeRow(row.id)}
                            aria-label={`Discard ${row.merchant}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-actions">
                <span className="import-selected-count">{importState.selectedCount} selected</span>
                <button
                  className="primary-button"
                  onClick={() => void importState.saveSelected()}
                  disabled={importState.selectedCount === 0 || importState.saving}
                >
                  {importState.saving ? 'Saving…' : 'Save selected'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>Nothing left to review</strong>
              <span>Start over to import another statement.</span>
            </div>
          )}

          {importState.unparsed.length > 0 && (
            <div className="section-block">
              <h2>Could not parse</h2>
              <ul className="unparsed-list">
                {importState.unparsed.map((row, index) => <li key={index}>{row.reason}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
