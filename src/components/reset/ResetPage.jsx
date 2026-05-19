import { useState } from 'react'
import { getResourceIds, deleteById, dumpResource } from '../../services/resetService'

const RESOURCES = [
  { label: 'Produits',   value: 'products' },
  { label: 'Clients',    value: 'customers' },
  { label: 'Commandes',  value: 'orders' },
  { label: 'Catégories', value: 'categories' },
]

function ResetPage() {
  const [resource, setResource]   = useState('products')
  const [status, setStatus]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [dumping, setDumping]     = useState(false)
  const [progress, setProgress]   = useState({ done: 0, total: 0 })
  const [confirm, setConfirm]     = useState(false)

  async function handleDump() {
    setDumping(true)
    setStatus(null)
    try {
      await dumpResource(resource)
      setStatus({ type: 'success', message: `Dump téléchargé avec succès.` })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setDumping(false)
    }
  }

  async function handleReset() {
    setLoading(true)
    setStatus(null)
    setProgress({ done: 0, total: 0 })

    try {
      const ids = await getResourceIds(resource)
      setProgress({ done: 0, total: ids.length })

      for (const id of ids) {
        await deleteById(resource, id)
        setProgress(prev => ({ ...prev, done: prev.done + 1 }))
      }

      setStatus({ type: 'success', message: `${ids.length} enregistrement(s) supprimé(s) avec succès.` })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  const resourceLabel = RESOURCES.find(r => r.value === resource)?.label

  return (
    <div>
      <h1 className="page-title">Réinitialisation des données</h1>

      <div className="reset-card">

        {/* Sélection de la table */}
        <div className="reset-row">
          <label>Table à réinitialiser</label>
          <select
            value={resource}
            onChange={e => { setResource(e.target.value); setConfirm(false); setStatus(null) }}
            disabled={loading || dumping}
          >
            {RESOURCES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Boutons Dump + Reset */}
        {!confirm && !loading && (
          <div className="reset-actions">
            <button className="btn-dump" onClick={handleDump} disabled={dumping}>
              {dumping ? 'Export en cours...' : '⬇ Exporter le dump XML'}
            </button>
            
            <button className="btn-danger" onClick={() => setConfirm(true)}>
              Réinitialiser
            </button>
          </div>
        )}

        {/* Confirmation */}
        {confirm && !loading && (
          <div className="reset-confirm">
            <p>⚠️ Voulez-vous vraiment supprimer <strong>tous les {resourceLabel}</strong> ? Cette action est irréversible.</p>
            <p style={{ fontSize: '13px', color: '#888' }}>Pensez à exporter le dump avant de continuer.</p>
            <div className="reset-confirm-buttons">
              <button className="btn-danger" onClick={handleReset}>Oui, supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {/* Progression */}
        {loading && (
          <div className="reset-progress">
            <p>Suppression en cours... {progress.done} / {progress.total}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Résultat */}
        {status && (
          <p className={`reset-status ${status.type}`}>{status.message}</p>
        )}

      </div>
    </div>
  )
}

export default ResetPage