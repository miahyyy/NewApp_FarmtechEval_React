import { useEffect, useState } from 'react'
import { getProducts } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import { getStocks } from '../../services/stockService'
import { IMAGE_BASE, WS_KEY } from '../../api/config'  // ← import config

function ProductList() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stocks, setStocks] = useState({})

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStocks()])
      .then(([prods, cats , stks]) => {
        setProducts(prods)
        setCategories(cats)
        setStocks(stks)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Produits ({products.length})</h1>
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
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>
                <img
                  src={`${IMAGE_BASE}/${product.productId}/${product.imageId}?ws_key=${WS_KEY}`}
                  alt={product.name}
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </td>
              <td>{product.name}</td>
              <td>{product.reference}</td>
              <td>{categories[product.category] || '—'}</td>
              <td>{product.price} €</td>
              <td>{product.priceTTC} €</td>
              <td>{stocks[product.id] ?? '0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductList