import { useEffect, useState } from 'react'
import { getStocksList } from '../../services/stockService'
import { getProducts } from '../../services/productService'
import ActionButtons from '../common/ActionButtons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import StockViewModal from './StockViewModal'
import StockEditModal from './StockEditModal'
import { deleteById } from '../../services/resetService'

function StockList() {
  const [stocks, setStocks]     = useState([])
  const [products, setProducts] = useState({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [viewStock, setViewStock] = useState(null)
  const [editStock, setEditStock] = useState(null)
  const [deleteId, setDeleteId]   = useState(null)

  useEffect(() => {
    Promise.all([getStocksList(), getProducts()])
      .then(([stks, prods]) => {
        const prodMap = {}
        prods.forEach(p => { prodMap[p.id] = { name: p.name, reference: p.reference } })
        setStocks(stks)
        setProducts(prodMap)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function handleDelete(id) {
    try {
      await deleteById('stock_availables', id)
      setStocks(prev => prev.filter(s => s.id !== id))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function handleSaved(updated) {
    setStocks(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Stocks ({stocks.length})</h1>

      {viewStock && (
        <StockViewModal
          stock={viewStock}
          products={products}
          onClose={() => setViewStock(null)}
        />
      )}
      {editStock && (
        <StockEditModal
          stock={editStock}
          products={products}
          onClose={() => setEditStock(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          entityName="le stock"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product name</th>
            <th>Reference</th>
            <th>Status</th>
            <th>Quantity</th>
            <th>Out of stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={`${stock.id}-${index}`}>
              <td>{stock.productId}</td>
              <td>{products[stock.productId]?.name || '—'}</td>
              <td>{products[stock.productId]?.reference || '—'}</td>
              <td>
                <span className={`product-status ${stock.quantity > 0 ? 'active' : 'inactive'}`}>
                  {stock.quantity > 0 ? 'En stock' : 'Rupture'}
                </span>
              </td>
              <td>{stock.quantity}</td>
              <td>
                <span className={`product-status ${stock.outOfStock === '1' ? 'active' : stock.outOfStock === '0' ? 'inactive' : 'default'}`}>
                  {stock.outOfStock === '1' ? 'Autorisé' : stock.outOfStock === '0' ? 'Refusé' : 'Défaut'}
                </span>
              </td>
              <td>
                <ActionButtons
                  onView={() => setViewStock(stock)}
                  onEdit={() => setEditStock(stock)}
                  onDelete={() => setDeleteId(stock.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StockList