import { useState } from 'react'
import Modal from '../common/Modal'
import { API_URL, WS_KEY } from '../../api/config'

function CategoryEditModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        category.name,
    description: category.description || '',
    active:      category.active,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <prestashop>
          <category>
            <id>${category.id}</id>
            <active>${form.active}</active>
            <name>
              <language id="1">${form.name}</language>
            </name>
            <description>
              <language id="1">${form.description}</language>
            </description>
          </category>
        </prestashop>
      `
      const res = await fetch(`${API_URL}/categories/${category.id}?ws_key=${WS_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/xml' },
        body: xml,
      })
      if (!res.ok) throw new Error('Erreur sauvegarde : ' + res.status)
      onSaved({ ...category, ...form })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Modifier catégorie #${category.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Nom</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Description</label>
          <input name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="modal-field">
          <label>Affiché</label>
          <select name="active" value={form.active} onChange={handleChange}>
            <option value="1">Oui</option>
            <option value="0">Non</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <div className="modal-footer">
        <button className="btn-cancel" onClick={onClose}>Annuler</button>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </Modal>
  )
}

export default CategoryEditModal