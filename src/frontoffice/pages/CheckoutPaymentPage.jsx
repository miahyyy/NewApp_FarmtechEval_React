import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFrontAuth } from '../../context/FrontAuthContext'
import { useCart } from '../../context/CartContext'
import { createOrder } from '../../services/checkoutService'
import { listCustomerAddresses, fetchAddressDisplay } from '../../services/addressWorkflowService'
import { fetchCashOnDeliveryModulesForCheckout } from '../../services/paymentModuleService'
import { findLatestOpenCartId, ensureCartSecureKeyMatchesCustomer } from '../../services/cartWorkflowService'

export default function CheckoutPaymentPage() {
  const { customer } = useFrontAuth()
  const { cart, total, clearCart, refreshCart, cartId, resolveCustomerSecureKey } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const navAddressId = location.state?.addressId

  const [addressId, setAddressId] = useState(navAddressId || null)
  const [addressObj, setAddressObj] = useState(null)
  const [paymentModules, setPaymentModules] = useState([])
  const [selectedPayment, setSelectedPayment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!customer) navigate('/login')
  }, [customer, navigate])

  useEffect(() => {
    ;(async () => {
      try {
        const mods = await fetchCashOnDeliveryModulesForCheckout()
        setPaymentModules(mods)
        if (mods[0]) setSelectedPayment(mods[0].name)
        setError(null)
      } catch (e) {
        console.error(e)
        setError('Impossible de charger les moyens de paiement')
      }
    })()
  }, [])

  useEffect(() => {
    if (!customer) return
    ;(async () => {
      try {
        let aid = addressId || navAddressId
        if (!aid) {
          const list = await listCustomerAddresses(customer.id)
          aid = list[0]?.id || null
          setAddressId(aid)
        }
        if (!aid) {
          navigate('/checkout/address')
          return
        }
        setAddressObj(await fetchAddressDisplay(aid))
      } catch (e) {
        console.error(e)
        navigate('/checkout/address')
      }
    })()
  }, [customer, navigate, navAddressId, addressId])

  if (!customer) return null

  async function handleConfirmOrder() {
    setLoading(true)
    setError(null)
    try {
      const openCartId = cartId || (await findLatestOpenCartId(customer.id))
      if (!openCartId) throw new Error('Panier introuvable')
      const sk = await resolveCustomerSecureKey()
      if (!sk) throw new Error('secure_key client introuvable : reconnectez-vous')
      await ensureCartSecureKeyMatchesCustomer(openCartId, sk)
      const mod = paymentModules.find((m) => m.name === selectedPayment)
      await createOrder({
        customer,
        cartId: openCartId,
        addressId,
        cartLines: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
        paymentModuleName: selectedPayment,
        paymentLabel: mod?.label || selectedPayment,
      })
      clearCart()
      await refreshCart()
      navigate('/my-orders', { state: { success: true } })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erreur commande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fo-checkout-page">
      <h1 className="fo-page-title">Paiement</h1>
      <div className="fo-checkout-layout">
        <div className="fo-checkout-form">
          <h2>Récapitulatif</h2>
          <div className="fo-summary-row">
            <span>Articles</span>
            <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
          </div>
          <div className="fo-summary-row">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          <div className="fo-summary-row">
            <span>Livraison</span>
            <span className="fo-free">Gratuit</span>
          </div>
          {addressObj && (
            <div className="fo-summary-row">
              <span>Adresse</span>
              <span>
                {addressObj.firstname} {addressObj.lastname} — {addressObj.address1}, {addressObj.postcode}{' '}
                {addressObj.city}
              </span>
            </div>
          )}

          <h2>Moyen de paiement</h2>
          {paymentModules.map((mod) => (
            <div
              key={mod.name}
              className={`fo-payment-option ${selectedPayment === mod.name ? 'selected' : ''}`}
              onClick={() => setSelectedPayment(mod.name)}
            >
              <div className="fo-payment-label">{mod.label}</div>
            </div>
          ))}

          {error && <div className="fo-error">{error}</div>}
          <button
            className="fo-btn-primary fo-btn-full"
            type="button"
            onClick={() => void handleConfirmOrder()}
            disabled={loading || !selectedPayment || paymentModules.length === 0 || !addressId}
          >
            {loading ? 'Validation en cours...' : 'Confirmer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
