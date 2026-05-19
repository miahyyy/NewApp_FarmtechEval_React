import Modal from '../common/Modal'

function CustomerViewModal({ customer, onClose }) {
  return (
    <Modal title={`Client #${customer.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field">
          <label>Titre</label>
          <span>{customer.socialTitle}</span>
        </div>
        <div className="modal-field">
          <label>Groupe</label>
          <span className={`product-status ${customer.group === 'Customer' ? 'active' : 'default'}`}>
            {customer.group}
          </span>
        </div>
        <div className="modal-field">
          <label>Prénom</label>
          <span>{customer.firstName}</span>
        </div>
        <div className="modal-field">
          <label>Nom</label>
          <span>{customer.lastName}</span>
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Email</label>
          <span>{customer.email}</span>
        </div>
        <div className="modal-field">
          <label>Inscription</label>
          <span>{customer.registration?.slice(0, 10)}</span>
        </div>
      </div>
    </Modal>
  )
}

export default CustomerViewModal