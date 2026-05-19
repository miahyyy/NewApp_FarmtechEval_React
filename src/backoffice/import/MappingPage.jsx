import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getResourceFields, importData } from '../../services/importService'

function MappingPage() {
  const navigate  = useNavigate()
  const resource  = sessionStorage.getItem('import_resource') || ''
  const csvData   = JSON.parse(sessionStorage.getItem('import_csv') || 'null')

  const [fields, setFields]     = useState({})
  const [mapping, setMapping]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [running, setRunning]   = useState(false)
  const [results, setResults]   = useState(null)

  // Charge les champs depuis l'API
  useEffect(() => {
    if (!resource) return
    getResourceFields(resource)
      .then(f => {
        setFields(f)

        // Mapping automatique si noms correspondent
        const auto = {}
        if (csvData) {
          csvData.headers.forEach(col => {
            const match = Object.keys(f).find(k =>
              k.toLowerCase() === col.toLowerCase()
            )
            if (match) auto[col] = match
          })
        }
        setMapping(auto)
        setLoading(false)
      })
  }, [resource])

  function handleMappingChange(csvCol, fieldKey) {
    setMapping(prev => ({ ...prev, [csvCol]: fieldKey }))
  }

  async function handleImport() {
    setRunning(true)
    setResults(null)
    setProgress({ done: 0, total: csvData.rows.length })

    const res = await importData(
      resource,
      mapping,
      csvData.rows,
      fields,
      (done, total) => setProgress({ done, total })
    )

    setResults(res)
    setRunning(false)
  }

  if (!csvData) return (
    <div>
      <h1 className="page-title">Mapping</h1>
      <p>Aucune donnée. <button onClick={() => navigate('/import')}>Retour</button></p>
    </div>
  )

  if (loading) return <p>Chargement des champs...</p>

  return (
    <div>
      <h1 className="page-title">Mapping — {resource}</h1>

      <div className="reset-card" style={{ maxWidth: '700px' }}>

        <table className="product-table">
          <thead>
            <tr>
              <th>Colonne CSV</th>
              <th>Aperçu (1ère ligne)</th>
              <th>Champ PrestaShop</th>
            </tr>
          </thead>
          <tbody>
            {csvData.headers.map(col => (
              <tr key={col}>
                <td><strong>{col}</strong></td>
                <td style={{ color: '#888', fontSize: '13px' }}>
                  {csvData.rows[0]?.[col] || '—'}
                </td>
                <td>
                  <select
                    value={mapping[col] || ''}
                    onChange={e => handleMappingChange(col, e.target.value)}
                  >
                    <option value="">— Ignorer —</option>
                    {Object.keys(fields).map(key => (
                      <option key={key} value={key}>{fields[key].label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Progression */}
        {running && (
          <div className="reset-progress">
            <p>Import en cours... {progress.done} / {progress.total}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="reset-status success">
              ✅ {results.success} ligne(s) importée(s) avec succès.
            </p>
            {results.errors.length > 0 && (
              <div className="reset-status" style={{ background: '#ffebee', color: '#c62828' }}>
                ❌ {results.errors.length} erreur(s) :
                <ul style={{ marginTop: '8px', fontSize: '13px' }}>
                  {results.errors.map((e, i) => (
                    <li key={i}>Ligne {e.row} : {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="reset-actions">
          <button className="btn-cancel" onClick={() => navigate('/import')}>
            ← Retour
          </button>
          <button
            className="btn-save"
            onClick={handleImport}
            disabled={running || !Object.values(mapping).some(v => v)}
          >
            {running ? 'Import en cours...' : '⬆ Lancer l\'import'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default MappingPage