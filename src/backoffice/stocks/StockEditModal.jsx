import { useState } from 'react'
import Modal from '../common/Modal'
import { API_URL, WS_KEY } from '../../api/config'

function StockEditModal({ stock, products, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(stock.quantity)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const product = products[stock.productId]

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <prestashop>
          <stock_available>
            <id>${stock.id}</id>
            <id_product>${stock.productId}</id_product>
            <id_product_attribute>0</id_product_attribute>
            <id_shop>1</id_shop>
            <quantity>${quantity}</quantity>
          </stock_available>
        </prestashop>
      `
      const res = await fetch(`${API_URL}/stock_availables/${stock.id}?ws_key=${WS_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/xml' },
        body: xml,
      })
      if (!res.ok) throw new Error('Erreur sauvegarde : ' + res.status)
      onSaved({ ...stock, quantity: parseInt(quantity) })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Modifier stock #${stock.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Produit</label>
          <span>{product?.name || '—'}</span>
        </div>
        <div className="modal-field">
          <label>Quantité</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            min="0"
          />
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

export default StockEditModal