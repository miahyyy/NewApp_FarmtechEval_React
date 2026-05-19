import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrontAuth } from '../../context/FrontAuthContext'
import { useCart } from '../../context/CartContext'
import { createCustomerAddress, listCustomerAddresses } from '../../services/addressWorkflowService'
import { findLatestOpenCartId, linkCartToAddresses } from '../../services/cartWorkflowService'

export default function CheckoutAddressPage() {
  const { customer } = useFrontAuth()
  const { refreshCart, resolveCustomerSecureKey } = useCart()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [address1, setAddress1] = useState('')

  useEffect(() => {
    if (!customer) navigate('/login')
  }, [customer, navigate])

  // Client déjà avec adresse(s) : on passe au paiement (pas de formulaire)
  useEffect(() => {
    if (!customer) return
    ;(async () => {
      try {
        const existing = await listCustomerAddresses(customer.id)
        if (existing.length > 0) {
          const first = existing[0]
          const openCart = await findLatestOpenCartId(customer.id)
          if (openCart) {
            const sk = await resolveCustomerSecureKey()
            await linkCartToAddresses(openCart, first.id, sk)
            await refreshCart()
          }
          navigate('/checkout/payment', { state: { addressId: first.id } })
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [customer, navigate, refreshCart, resolveCustomerSecureKey])

  if (!customer) return null

  async function handleAddressSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const addressId = await createCustomerAddress({ customer, address1 })
      const openCart = await findLatestOpenCartId(customer.id)
      if (!openCart) throw new Error('Panier introuvable : ajoutez des articles avant l’adresse')
      const sk = await resolveCustomerSecureKey()
      await linkCartToAddresses(openCart, addressId, sk)
      await refreshCart()
      navigate('/checkout/payment', { state: { addressId } })
    } catch (err) {
      console.error('Erreur adresse:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fo-checkout-page">
      <h1 className="fo-page-title">Adresse de Livraison</h1>
      <div className="fo-checkout-layout">
        <div className="fo-checkout-form">
          <form onSubmit={handleAddressSubmit}>
            <div className="fo-field">
              <label>Adresse complète</label>
              <input name="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} required />
            </div>
            {error && <div className="fo-error">{error}</div>}
            <button className="fo-btn-primary" disabled={loading} type="submit">
              {loading ? 'Chargement...' : 'Enregistrer adresse'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
