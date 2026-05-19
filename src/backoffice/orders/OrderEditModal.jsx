import { useState } from 'react'
import Modal from '../common/Modal'
import { updateOrderState } from '../../services/orderService'
import { isOrderStateSelectableForExam } from '../../services/orderExamStateUtils'

function OrderEditModal({ order, states, onClose, onSaved }) {
  const [form, setForm] = useState({
    state: order.state,
    note: order.note || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const allowedStates = Object.entries(states).filter(([, state]) => isOrderStateSelectableForExam(state.label))

  const currentState = states[form.state]
  const showCurrent = currentState && !allowedStates.some(([id]) => id === form.state)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateOrderState(order.id, form.state, form.note)
      onSaved({ ...order, state: form.state })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Modifier commande #${order.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Statut</label>
          <select name="state" value={form.state} onChange={handleChange}>
            {showCurrent && (
              <option value={form.state} disabled>
                {currentState?.label || `Etat ${form.state}`} (actuel)
              </option>
            )}
            {allowedStates.map(([id, state]) => (
              <option key={id} value={id}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Note</label>
          <input name="note" value={form.note} onChange={handleChange} />
        </div>
      </div>

      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <div className="modal-footer">
        <button type="button" className="btn-cancel" onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </Modal>
  )
}

export default OrderEditModal
