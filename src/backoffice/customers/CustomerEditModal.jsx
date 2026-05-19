import { useState } from 'react'
import Modal from '../common/Modal'
import { API_URL, WS_KEY } from '../../api/config'

function CustomerEditModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: customer.firstName,
    lastName:  customer.lastName,
    email:     customer.email,
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
          <customer>
            <id>${customer.id}</id>
            <firstname>${form.firstName}</firstname>
            <lastname>${form.lastName}</lastname>
            <email>${form.email}</email>
          </customer>
        </prestashop>
      `
      const res = await fetch(`${API_URL}/customers/${customer.id}?ws_key=${WS_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/xml' },
        body: xml,
      })
      if (!res.ok) throw new Error('Erreur sauvegarde : ' + res.status)
      onSaved({ ...customer, ...form })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Modifier client #${customer.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field">
          <label>Prénom</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} />
        </div>
        <div className="modal-field">
          <label>Nom</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} />
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} />
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

export default CustomerEditModal