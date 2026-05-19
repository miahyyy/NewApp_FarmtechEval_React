import Modal from '../common/Modal'

function OrderViewModal({ order, customers, states, onClose }) {
  const state   = states[order.state]
  const customer = customers[order.customerId]

  return (
    <Modal title={`Commande #${order.id} — ${order.reference}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field">
          <label>Référence</label>
          <span>{order.reference}</span>
        </div>
        <div className="modal-field">
          <label>Client</label>
          <span>{customer || `Client #${order.customerId}`}</span>
        </div>
        <div className="modal-field">
          <label>Total TTC</label>
          <span>{order.totalPaid} €</span>
        </div>
        <div className="modal-field">
          <label>Livraison</label>
          <span>{order.shipping} €</span>
        </div>
        <div className="modal-field">
          <label>Paiement</label>
          <span>{order.payment}</span>
        </div>
        <div className="modal-field">
          <label>Date</label>
          <span>{order.dateAdd?.slice(0, 10)}</span>
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Statut</label>
          {state ? (
            <span style={{
              background: state.color + '22',
              color: state.color,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              border: `1px solid ${state.color}44`,
              display: 'inline-block'
            }}>
              {state.label}
            </span>
          ) : `État ${order.state}`}
        </div>
      </div>
    </Modal>
  )
}

export default OrderViewModal