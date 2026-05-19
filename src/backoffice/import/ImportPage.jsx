import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { fetchResources } from '../../services/resetService'

function ImportPage() {
  const [resources, setResources] = useState([])
  const [resource, setResource]   = useState('')
  const [csvData, setCsvData]     = useState(null)
  const [error, setError]         = useState(null)
  const [fileName, setFileName]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const fileRef                   = useRef()
  const navigate                  = useNavigate()

  // Récupère les ressources depuis l'API
  useEffect(() => {
    fetchResources()
      .then(data => {
        setResources(data)
        if (data.length > 0) setResource(data[0].name)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    setCsvData(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data.length) {
          setError('Le fichier CSV est vide.')
          return
        }
        setCsvData({
          headers: result.meta.fields,
          rows:    result.data,
        })
      },
      error: (err) => {
        setError('Erreur lecture CSV : ' + err.message)
      }
    })
  }

  function handleNext() {
    sessionStorage.setItem('import_resource', resource)
    sessionStorage.setItem('import_csv', JSON.stringify(csvData))
    navigate('/admin/import/mapping')
  }

  if (loading) return <p>Chargement des ressources...</p>

  return (
    <div>
      <h1 className="page-title">Import de données</h1>

      <div className="reset-card" style={{ maxWidth: '600px' }}>

        {/* Choix ressource depuis l'API */}
        <div className="reset-row">
          <label>Ressource cible ({resources.length} disponibles)</label>
          <select
            value={resource}
            onChange={e => setResource(e.target.value)}
          >
            {resources.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Upload CSV */}
        <div className="reset-row">
          <label>Fichier CSV</label>
          <div
            className="import-dropzone"
            onClick={() => fileRef.current.click()}
          >
            {fileName
              ? <span>📄 {fileName}</span>
              : <span>Cliquez pour choisir un fichier CSV</span>
            }
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Aperçu */}
        {csvData && (
          <div className="import-preview">
            <p style={{ fontSize: '14px', color: '#555' }}>
              ✅ <strong>{csvData.rows.length}</strong> lignes détectées —
              colonnes : <em>{csvData.headers.join(', ')}</em>
            </p>
          </div>
        )}

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <button
          className="btn-save"
          onClick={handleNext}
          disabled={!csvData || !resource}
        >
          Suivant → Mapping
        </button>

      </div>
    </div>
  )
}

export default ImportPage