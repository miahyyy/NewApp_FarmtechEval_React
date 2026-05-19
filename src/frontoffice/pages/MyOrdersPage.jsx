import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useFrontAuth }  from '../../context/FrontAuthContext'
import { getOrders } from '../../services/checkoutService'

export default function MyOrdersPage() {
  const { customer }   = useFrontAuth()
  const location       = useLocation()
  const success        = location.state?.success

  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!customer) return
    getOrders(customer.id)
      .then(ords => {
        setOrders(ords)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [customer])

  if (!customer) return (
    <div className="fo-empty">
      <p>Connectez-vous pour voir vos commandes.</p>
    </div>
  )

  if (loading) return <div className="fo-loading"><div className="fo-spinner" /></div>

  if (error) return (
    <div className="fo-empty">
      <p>{error}</p>
    </div>
  )

  return (
    <div className="fo-orders-page">
      <h1 className="fo-page-title">Mes commandes</h1>

      {success && (
        <div className="fo-success-banner">
          ✓ Commande passée avec succès ! Nous vous contacterons bientôt.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="fo-empty">
          <p>Vous n'avez pas encore de commande.</p>
        </div>
      ) : (
        <div className="fo-orders-list">
          {orders.map((order, i) => {
            const state = order.state
            return (
              <div key={`${order.id}-${i}`} className="fo-order-card">
                <div className="fo-order-header">
                  <div className="fo-order-ref">{order.reference}</div>
                  <div className="fo-order-date">
                    {order.dateAdd?.slice(0, 10)}
                  </div>
                </div>
                <div className="fo-order-body">
                  <div className="fo-order-info">
                    <span>Total</span>
                    <strong>{parseFloat(order.totalPaid).toFixed(2)} €</strong>
                  </div>
                  <div className="fo-order-info">
                    <span>Produits</span>
                    <strong>{order.items?.length || 0}</strong>
                  </div>
                  <div className="fo-order-info">
                    <span>Paiement</span>
                    <strong>{order.payment}</strong>
                  </div>
                  <div className="fo-order-info">
                    <span>Statut</span>
                    {state ? (
                      <span className="fo-order-state" style={{
                        background: state.color + '18',
                        color: state.color,
                        border: `1px solid ${state.color}33`,
                      }}>
                        {state.label}
                      </span>
                    ) : <span>—</span>}
                  </div>
                  {order.items?.length > 0 && (
                    <div className="fo-order-info">
                      <span>Details</span>
                      <strong>
                        {order.items.map((item, idx) => (
                          <span key={`${order.id}-${idx}`}>
                            {item.productName} x{item.quantity}
                            {idx < order.items.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}