import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts }   from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import { getStocks }     from '../../services/stockService'
import { IMAGE_BASE, WS_KEY } from '../../api/config'

export default function HomePage() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState({})
  const [stocks, setStocks]         = useState({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedCat, setSelectedCat] = useState('')

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStocks()])
      .then(([prods, cats, stks]) => {
        setProducts(prods)
        setCategories(cats)
        setStocks(stks)
        setLoading(false)
      })
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !selectedCat || p.category === selectedCat
    return matchSearch && matchCat
  })

  const uniqueCats = [...new Set(products.map(p => p.category))]

  if (loading) return (
    <div className="fo-loading">
      <div className="fo-spinner" />
      Chargement des produits…
    </div>
  )

  return (
    <div className="fo-home">

      {/* Hero */}
      <section className="fo-hero">
        <div className="fo-hero-inner">
          <h1 className="fo-hero-title">
            Découvrez notre<br />
            <em>collection exclusive</em>
          </h1>
          <p className="fo-hero-sub">
            Des produits soigneusement sélectionnés pour vous
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="fo-filters">
        <input
          className="fo-search"
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="fo-cats">
          <button
            className={`fo-cat-btn ${!selectedCat ? 'active' : ''}`}
            onClick={() => setSelectedCat('')}
          >
            Tout
          </button>
          {uniqueCats.map(catId => (
            <button
              key={catId}
              className={`fo-cat-btn ${selectedCat === catId ? 'active' : ''}`}
              onClick={() => setSelectedCat(catId)}
            >
              {categories[catId] || catId}
            </button>
          ))}
        </div>
      </section>

      {/* Products grid */}
      <section className="fo-grid">
        {filtered.length === 0 && (
          <div className="fo-empty">Aucun produit trouvé</div>
        )}
        {filtered.map((product, i) => (
          <Link
            to={`/product/${product.id}`}
            key={`${product.id}-${i}`}
            className="fo-card"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="fo-card-img-wrap">
              <img
                src={`${IMAGE_BASE}/${product.productId}/${product.imageId}?ws_key=${WS_KEY}`}
                alt={product.name}
                className="fo-card-img"
                onError={e => { e.target.style.display = 'none' }}
              />
              {parseInt(stocks[product.id] || 0) === 0 && (
                <span className="fo-card-badge-out">Rupture</span>
              )}
            </div>
            <div className="fo-card-body">
              <div className="fo-card-cat">
                {categories[product.category] || '—'}
              </div>
              <h3 className="fo-card-name">{product.name}</h3>
              <div className="fo-card-footer">
                <span className="fo-card-price">{product.price} €</span>
                <span className="fo-card-arrow">→</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

    </div>
  )
}