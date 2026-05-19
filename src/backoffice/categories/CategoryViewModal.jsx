import Modal from '../common/Modal'

function CategoryViewModal({ category, onClose }) {
  return (
    <Modal title={`Catégorie #${category.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Nom</label>
          <span>{category.name}</span>
        </div>
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Description</label>
          <span>{category.description || '—'}</span>
        </div>
        <div className="modal-field">
          <label>Position</label>
          <span>{category.position}</span>
        </div>
        <div className="modal-field">
          <label>Affiché</label>
          <span className={`product-status ${category.active === '1' ? 'active' : 'inactive'}`}>
            {category.active === '1' ? 'Oui' : 'Non'}
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default CategoryViewModal