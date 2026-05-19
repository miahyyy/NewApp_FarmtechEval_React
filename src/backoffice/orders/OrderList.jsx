import { useEffect, useState } from 'react'
import { getOrders, getOrderStates } from '../../services/orderService'
import { getCustomersMap } from '../../services/customerService'
import { deleteById } from '../../services/resetService'
import ActionButtons from '../common/ActionButtons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import OrderViewModal from './OrderViewModal'
import OrderEditModal from './OrderEditModal'

function OrderList() {
  const [orders, setOrders]       = useState([])
  const [customers, setCustomers] = useState({})
  const [states, setStates]       = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  function displayLabel(label) {
    return label || '—'
  }

  useEffect(() => {
    Promise.all([getOrders(), getCustomersMap(), getOrderStates()])
      .then(([ords, custs, sts]) => {
        setOrders(ords)
        setCustomers(custs)
        setStates(sts)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function handleDelete(id) {
    try {
      await deleteById('orders', id)
      setOrders(prev => prev.filter(o => o.id !== id))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function handleSaved(updated) {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Commandes ({orders.length})</h1>

      {viewOrder && (
        <OrderViewModal
          order={viewOrder}
          customers={customers}
          states={states}
          onClose={() => setViewOrder(null)}
        />
      )}
      {editOrder && (
        <OrderEditModal
          order={editOrder}
          states={states}
          onClose={() => setEditOrder(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          entityName="la commande"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reference</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Delivery</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const state = states[order.state]
            return (
              <tr key={`${order.id}-${index}`}>
                <td>{order.id}</td>
                <td><strong>{order.reference}</strong></td>
                <td>{customers[order.customerId] || `Client #${order.customerId}`}</td>
                <td>{order.totalPaid} €</td>
                <td>{order.shipping} €</td>
                <td>{order.payment}</td>
                <td>
                  {state ? (
                    <span style={{
                      background: state.color + '22',
                      color: state.color,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: `1px solid ${state.color}44`
                    }}>
                      {displayLabel(state.label)}
                    </span>
                  ) : `Etat ${order.state}`}
                </td>
                <td>{order.dateAdd?.slice(0, 10)}</td>
                <td>
                  <ActionButtons
                    onView={() => setViewOrder(order)}
                    onEdit={() => setEditOrder(order)}
                    onDelete={() => setDeleteId(order.id)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default OrderList