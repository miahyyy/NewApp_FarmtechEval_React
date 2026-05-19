import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProducts }   from '../../services/productService'
import { getStocks }     from '../../services/stockService'
import { getCategories } from '../../services/categoryService'
import { useCart }       from '../../context/CartContext'
import { IMAGE_BASE, WS_KEY } from '../../api/config'

import { useFrontAuth }  from '../../context/FrontAuthContext'

export default function ProductPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { addToCart } = useCart()
  const { customer } = useFrontAuth()

  const [product, setProduct]     = useState(null)
  const [categories, setCategories] = useState({})
  const [stock, setStock]         = useState(0)
  const [qty, setQty]             = useState(1)
  const [added, setAdded]         = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getProducts(), getStocks(), getCategories()])
      .then(([prods, stks, cats]) => {
        const found = prods.find(p => p.id === id)
        setProduct(found || null)
        setStock(parseInt(stks[id] || 0))
        setCategories(cats)
        setLoading(false)
      })
  }, [id])

  async function handleAdd() {
    if (!product) return
    if (!customer) {
      // French comments: Redirige au login si client anonyme
      navigate('/login')
      return
    }
    try {
      await addToCart(product, qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="fo-loading"><div className="fo-spinner" /></div>
  if (!product) return <div className="fo-empty">Produit introuvable</div>

  return (
    <div className="fo-product-page">

      <button className="fo-back-btn" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="fo-product-inner">

        {/* Image */}
        <div className="fo-product-img-wrap">
          <img
            src={`${IMAGE_BASE}/${product.productId}/${product.imageId}?ws_key=${WS_KEY}`}
            alt={product.name}
            className="fo-product-img"
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Info */}
        <div className="fo-product-info">

          <div className="fo-product-cat">
            {categories[product.category] || '—'}
          </div>

          <h1 className="fo-product-title">{product.name}</h1>

          <div className="fo-product-ref">
            Réf : {product.reference}
          </div>

          <div className="fo-product-price">
            {product.price} €
            <span className="fo-product-ttc">
              ({product.priceTTC} € TTC)
            </span>
          </div>

          <div className="fo-product-stock">
            {stock > 0
              ? <span className="fo-stock-ok">✓ En stock ({stock})</span>
              : <span className="fo-stock-out">✗ Rupture de stock</span>
            }
          </div>

          {/* Quantity */}
          {stock > 0 && (
            <div className="fo-product-actions">
              <div className="fo-qty-wrap">
                <button
                  className="fo-qty-btn"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                >−</button>
                <span className="fo-qty-val">{qty}</span>
                <button
                  className="fo-qty-btn"
                  onClick={() => setQty(q => Math.min(stock, q + 1))}
                >+</button>
              </div>

              <button
                className={`fo-btn-primary ${added ? 'fo-btn-added' : ''}`}
                onClick={handleAdd}
              >
                {added ? '✓ Ajouté !' : 'Ajouter au panier'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}