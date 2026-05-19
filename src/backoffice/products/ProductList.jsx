import { useEffect, useState } from 'react'
import { getProducts } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import { getStocks } from '../../services/stockService'
import { deleteById } from '../../services/resetService'
import { IMAGE_BASE, WS_KEY } from '../../api/config'
import ActionButtons from '../common/ActionButtons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import ProductViewModal from './ProductViewModal'
import ProductEditModal from './ProductEditModal'

function ProductList() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState({})
  const [stocks, setStocks]         = useState({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [viewProduct, setViewProduct] = useState(null)  // ← produit à voir
  const [editProduct, setEditProduct] = useState(null)  // ← produit à modifier
  const [deleteId, setDeleteId]       = useState(null)  // ← id à supprimer

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStocks()])
      .then(([prods, cats, stks]) => {
        setProducts(prods)
        setCategories(cats)
        setStocks(stks)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function handleDelete(id) {
    try {
      await deleteById('products', id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function handleSaved(updatedProduct) {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Produits ({products.length})</h1>

      {viewProduct && (
        <ProductViewModal
          product={viewProduct}
          categories={categories}
          stocks={stocks}
          onClose={() => setViewProduct(null)}
        />
      )}

      {editProduct && (
        <ProductEditModal
          product={editProduct}
          categories={categories}
          onClose={() => setEditProduct(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          entityName="le produit"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Reference</th>
            <th>Category</th>
            <th>Price (tax excl.)</th>
            <th>Price (tax incl.)</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={`${product.id}-${index}`}>
              <td>{product.id}</td>
              <td>
                <img
                  src={`${IMAGE_BASE}/${product.productId}/${product.imageId}?ws_key=${WS_KEY}`}
                  alt={product.name}
                  width={50} height={50}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </td>
              <td>{product.name}</td>
              <td>{product.reference}</td>
              <td>{categories[product.category] || '—'}</td>
              <td>{product.price} €</td>
              <td>{product.priceTTC} €</td>
              <td>{stocks[product.id] ?? '0'}</td>
              <td>
                <ActionButtons
                  entity="products"
                  id={product.id}
                  onView={() => setViewProduct(product)}
                  onEdit={() => setEditProduct(product)}
                  onDelete={() => setDeleteId(product.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductList