import Modal from '../common/Modal'
import { IMAGE_BASE, WS_KEY } from '../../api/config'

function ProductViewModal({ product, categories, stocks, onClose }) {
  return (
    <Modal title={`Produit #${product.id}`} onClose={onClose}>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
        <img
          src={`${IMAGE_BASE}/${product.productId}/${product.imageId}?ws_key=${WS_KEY}`}
          alt={product.name}
          width={120} height={120}
          style={{ objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div className="modal-field">
            <label>Nom</label>
            <span>{product.name}</span>
          </div>
          <div className="modal-field">
            <label>Référence</label>
            <span>{product.reference}</span>
          </div>
          <div className="modal-field">
            <label>Catégorie</label>
            <span>{categories[product.category] || '—'}</span>
          </div>
        </div>
      </div>

      <div className="modal-grid">
        <div className="modal-field">
          <label>Prix HT</label>
          <span>{product.price} €</span>
        </div>
        <div className="modal-field">
          <label>Prix TTC</label>
          <span>{product.priceTTC} €</span>
        </div>
        <div className="modal-field">
          <label>Quantité</label>
          <span>{stocks[product.id] ?? '0'}</span>
        </div>
        <div className="modal-field">
          <label>Statut</label>
          <span className={`product-status ${product.active === '1' ? 'active' : 'inactive'}`}>
            {product.active === '1' ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default ProductViewModal