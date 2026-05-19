import Modal from '../common/Modal'

function StockViewModal({ stock, products, onClose }) {
  const product = products[stock.productId]
  return (
    <Modal title={`Stock #${stock.id}`} onClose={onClose}>
      <div className="modal-grid">
        <div className="modal-field" style={{ gridColumn: '1 / -1' }}>
          <label>Produit</label>
          <span>{product?.name || '—'}</span>
        </div>
        <div className="modal-field">
          <label>Référence</label>
          <span>{product?.reference || '—'}</span>
        </div>
        <div className="modal-field">
          <label>Quantité</label>
          <span>{stock.quantity}</span>
        </div>
        <div className="modal-field">
          <label>Statut</label>
          <span className={`product-status ${stock.quantity > 0 ? 'active' : 'inactive'}`}>
            {stock.quantity > 0 ? 'En stock' : 'Rupture'}
          </span>
        </div>
        <div className="modal-field">
          <label>Commande hors stock</label>
          <span>{stock.outOfStock === '1' ? 'Autorisé' : stock.outOfStock === '0' ? 'Refusé' : 'Défaut'}</span>
        </div>
      </div>
    </Modal>
  )
}

export default StockViewModal