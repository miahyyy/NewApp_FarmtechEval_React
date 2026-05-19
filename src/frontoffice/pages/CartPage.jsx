import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useFrontAuth } from '../../context/FrontAuthContext'
import { IMAGE_BASE, WS_KEY } from '../../api/config'
import { listCustomerAddresses } from '../../services/addressWorkflowService'
import { findLatestOpenCartId, linkCartToAddresses } from '../../services/cartWorkflowService'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total, refreshCart, resolveCustomerSecureKey } = useCart()
  const { customer } = useFrontAuth()
  const navigate = useNavigate()

  async function handleCheckout() {
    if (!customer) {
      navigate('/login')
      return
    }
    const openCart = await findLatestOpenCartId(customer.id)
    if (!openCart) {
      navigate('/')
      return
    }
    const addresses = await listCustomerAddresses(customer.id)
    if (addresses.length === 0) {
      navigate('/checkout/address')
      return
    }
    const first = addresses[0]
    const sk = await resolveCustomerSecureKey()
    await linkCartToAddresses(openCart, first.id, sk)
    await refreshCart()
    navigate('/checkout/payment', { state: { addressId: first.id } })
  }

  if (cart.length === 0)
    return (
      <div className="fo-cart-empty">
        <div className="fo-cart-empty-icon">🛒</div>
        <h2>Votre panier est vide</h2>
        <Link to="/" className="fo-btn-primary">
          Continuer mes achats
        </Link>
      </div>
    )

  return (
    <div className="fo-cart-page">
      <h1 className="fo-page-title">Mon panier</h1>

      <div className="fo-cart-layout">
        <div className="fo-cart-items">
          {cart.map((item, i) => (
            <div key={`${item.id}-${i}`} className="fo-cart-item">
              <img
                src={item.image || `${IMAGE_BASE}/${item.productId}/${item.imageId}?ws_key=${WS_KEY}`}
                alt={item.name}
                className="fo-cart-item-img"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <div className="fo-cart-item-info">
                <div className="fo-cart-item-name">{item.name}</div>
                <div className="fo-cart-item-ref">Réf : {item.reference}</div>
              </div>
              <div className="fo-cart-item-qty">
                <button type="button" onClick={() => void updateQuantity(item.id, item.quantity - 1)}>
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => void updateQuantity(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <div className="fo-cart-item-price">{(parseFloat(item.price) * item.quantity).toFixed(2)} €</div>
              <button type="button" className="fo-cart-item-remove" onClick={() => void removeFromCart(item.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="fo-cart-summary">
          <h2>Récapitulatif</h2>
          <div className="fo-summary-row">
            <span>Sous-total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          <div className="fo-summary-row">
            <span>Livraison</span>
            <span className="fo-free">Gratuit</span>
          </div>
          <div className="fo-summary-total">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          <button type="button" className="fo-btn-primary fo-btn-full" onClick={() => void handleCheckout()}>
            {customer ? 'Commander' : 'Se connecter pour commander'}
          </button>
          <Link to="/" className="fo-btn-secondary fo-btn-full">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  )
}
