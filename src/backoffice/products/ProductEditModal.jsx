import { useState } from 'react'
import Modal from '../common/Modal'
import { API_URL, WS_KEY } from '../../api/config'

function ProductEditModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:      product.name,
    price:     product.price,
    reference: product.reference,
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
      // PrestaShop nécessite un PUT avec le XML complet
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <prestashop>
          <product>
            <id>${product.id}</id>
            <price>${form.price}</price>
            <reference>${form.reference}</reference>
            <name>
              <language id="1">${form.name}</language>
            </name>
          </product>
        </prestashop>
      `
      const res = await fetch(`${API_URL}/products/${product.id}?ws_key=${WS_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/xml' },
        body: xml,
      })
      if (!res.ok) throw new Error('Erreur sauvegarde : ' + res.status)
      onSaved({ ...product, ...form })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Modifier produit #${product.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Nom</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className="modal-field">
          <label>Prix HT</label>
          <input name="price" type="number" value={form.price} onChange={handleChange} />
        </div>
        <div className="modal-field">
          <label>Référence</label>
          <input name="reference" value={form.reference} onChange={handleChange} />
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

export default ProductEditModal