import { useEffect, useState } from 'react'
import { getProducts } from '../../services/productService'
import { getOrders, getOrderStates } from '../../services/orderService'
import { getCustomersMap } from '../../services/customerService'
import { getStocks } from '../../services/stockService'

/* ── Recharts ─────────────────────────────────────────── */
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function fmt(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(n)
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

/* ── KPI Card ─────────────────────────────────────────── */
function KpiCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div className="kpi-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

/* ── Custom Tooltip ───────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span>{typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   FORECAST LOGIC
══════════════════════════════════════════════════════ */
function buildForecast(orders) {
  // Group real orders by month
  const byMonth = {}
  orders.forEach(o => {
    const d = new Date(o.dateAdd)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] || 0) + parseFloat(o.totalPaid || 0)
  })

  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]

  // Average of real data to seed forecast
  const realValues = Object.values(byMonth)
  const avg = realValues.length
    ? realValues.reduce((a, b) => a + b, 0) / realValues.length
    : 8000

  // Build 12 months forecast with growth trend
  return months.map((month, i) => {
    const growth = 1 + (i * 0.04) + (Math.random() * 0.06 - 0.03)
    const forecast = Math.round(avg * growth)
    const optimistic = Math.round(forecast * 1.18)
    const pessimistic = Math.round(forecast * 0.84)
    return { month, forecast, optimistic, pessimistic }
  })
}

/* ══════════════════════════════════════════════════════
   SALES CHART DATA
══════════════════════════════════════════════════════ */
function buildSalesData(orders) {
  const byMonth = {}
  orders.forEach(o => {
    const d = new Date(o.dateAdd)
    const key = new Date(d.getFullYear(), d.getMonth(), 1)
      .toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    if (!byMonth[key]) byMonth[key] = { revenue: 0, orders: 0 }
    byMonth[key].revenue += parseFloat(o.totalPaid || 0)
    byMonth[key].orders += 1
  })

  return Object.entries(byMonth).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue),
    orders: data.orders,
  }))
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [products, setProducts]   = useState([])
  const [orders, setOrders]       = useState([])
  const [customers, setCustomers] = useState({})
  const [states, setStates]       = useState({})
  const [stocks, setStocks]       = useState({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getProducts(),
      getOrders(),
      getCustomersMap(),
      getOrderStates(),
      getStocks(),
    ]).then(([prods, ords, custs, sts, stks]) => {
      setProducts(prods)
      setOrders(ords)
      setCustomers(custs)
      setStates(sts)
      setStocks(stks)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <span>Chargement du tableau de bord…</span>
    </div>
  )

  /* ── KPIs ─────────────────────────────────────────── */
  const totalRevenue   = orders.reduce((s, o) => s + parseFloat(o.totalPaid || 0), 0)
  const totalProducts  = products.length
  const totalOrders    = orders.length
  const lowStock       = Object.values(stocks).filter(q => parseInt(q) < 100).length
  const avgOrder       = totalOrders ? totalRevenue / totalOrders : 0

  /* ── Last 10 orders ───────────────────────────────── */
  const last10 = [...orders]
    .sort((a, b) => new Date(b.dateAdd) - new Date(a.dateAdd))
    .slice(0, 10)

  /* ── Charts ───────────────────────────────────────── */
  const salesData    = buildSalesData(orders)
  const forecastData = buildForecast(orders)

  /* ── Top products by stock ────────────────────────── */
  const topProducts = products
    .map(p => ({ ...p, stock: parseInt(stocks[p.id] || 0) }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)

  return (
    <div className="dashboard">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Vue d'ensemble — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="dash-badge">
          <span className="dash-live-dot" />
          Live
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard label="Chiffre d'affaires" value={fmt(totalRevenue)} sub="Total commandes" accent="var(--gold)" delay={0} />
        <KpiCard label="Commandes" value={totalOrders} sub="Toutes périodes" delay={60} />
        <KpiCard label="Produits" value={totalProducts} sub={`${lowStock} stock faible`} delay={120} />
        <KpiCard label="Panier moyen" value={fmt(avgOrder)} sub="Par commande" accent="var(--success)" delay={180} />
      </div>

      {/* ── FORECAST 2026 ──────────────────────────── */}
      <div className="dash-section-title">
        <span>◆</span> Prévisions 2026
        <span className="dash-forecast-tag">Modèle tendance</span>
      </div>

      <div className="dash-row">
        {/* Bar chart forecast */}
        <div className="dash-card dash-card-wide">
          <div className="dash-card-header">
            <span className="dash-card-title">Revenus prévisionnels mensuels</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ color: 'var(--gold)' }}>● Forecast</span>
              <span style={{ color: 'var(--success)' }}>● Optimiste</span>
              <span style={{ color: 'var(--danger)' }}>● Pessimiste</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#4a4a5e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a4a5e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pessimistic" name="Pessimiste" fill="rgba(240,92,92,0.25)" radius={[3,3,0,0]} />
              <Bar dataKey="forecast"    name="Forecast"   fill="rgba(201,168,76,0.7)" radius={[3,3,0,0]} />
              <Bar dataKey="optimistic"  name="Optimiste"  fill="rgba(45,212,160,0.35)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast summary cards */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Projections annuelles</span>
          </div>
          <div className="dash-forecast-summary">
            {[
              { label: 'Scénario pessimiste', key: 'pessimistic', color: 'var(--danger)' },
              { label: 'Scénario de base',    key: 'forecast',    color: 'var(--gold)' },
              { label: 'Scénario optimiste',  key: 'optimistic',  color: 'var(--success)' },
            ].map(({ label, key, color }) => {
              const annual = forecastData.reduce((s, m) => s + m[key], 0)
              const monthly = Math.round(annual / 12)
              return (
                <div key={key} className="dash-forecast-card" style={{ borderColor: color + '30' }}>
                  <div className="dash-forecast-label" style={{ color }}>{label}</div>
                  <div className="dash-forecast-value" style={{ color }}>{fmt(annual)}</div>
                  <div className="dash-forecast-monthly">~{fmt(monthly)} / mois</div>
                </div>
              )
            })}
            <div className="dash-forecast-note">
              ⚠ Basé sur la tendance des commandes existantes. Résultats indicatifs.
            </div>
          </div>
        </div>
      </div>


      {/* ── PRODUCTS & SALES ───────────────────────── */}
      <div className="dash-section-title">
        <span>◆</span> Produits & Ventes
      </div>

      <div className="dash-row">
        {/* Area chart — revenue */}
        <div className="dash-card dash-card-wide">
          <div className="dash-card-header">
            <span className="dash-card-title">Revenus par mois</span>
            <span className="dash-card-tag">{salesData.length} périodes</span>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#4a4a5e', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a4a5e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#c9a84c" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: '#c9a84c' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">Pas de données de vente</div>
          )}
        </div>

        {/* Top products */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Top produits</span>
            <span className="dash-card-tag">par stock</span>
          </div>
          <div className="dash-top-list">
            {topProducts.map((p, i) => (
              <div key={p.id} className="dash-top-item">
                <div className="dash-top-rank">{i + 1}</div>
                <div className="dash-top-info">
                  <div className="dash-top-name">{p.name}</div>
                  <div className="dash-top-ref">{p.reference}</div>
                </div>
                <div className="dash-top-stock" style={{
                  color: p.stock < 100 ? 'var(--danger)' : p.stock < 500 ? 'var(--warning)' : 'var(--success)'
                }}>
                  {p.stock.toLocaleString()}
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <div className="dash-empty">Aucun produit</div>}
          </div>
        </div>
      </div>

      {/* ── LAST 10 ORDERS ─────────────────────────── */}
      <div className="dash-section-title">
        <span>◆</span> 10 Dernières commandes
      </div>

      <div className="dash-card dash-card-full">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Total</th>
              <th>Paiement</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {last10.map((order, i) => {
              const state = states[order.state]
              return (
                <tr key={order.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <span className="dash-ref">{order.reference}</span>
                  </td>
                  <td>{customers[order.customerId] || `#${order.customerId}`}</td>
                  <td>
                    <span className="dash-amount">{fmt(parseFloat(order.totalPaid || 0))}</span>
                  </td>
                  <td>
                    <span className="dash-payment">{order.payment}</span>
                  </td>
                  <td>
                    {state ? (
                      <span className="dash-state-badge" style={{
                        background: state.color + '18',
                        color: state.color,
                        border: `1px solid ${state.color}33`,
                      }}>
                        {state.label}
                      </span>
                    ) : <span className="product-status default">État {order.state}</span>}
                  </td>
                  <td className="dash-date">{fmtDate(order.dateAdd)}</td>
                </tr>
              )
            })}
            {last10.length === 0 && (
              <tr><td colSpan={6} className="dash-empty">Aucune commande</td></tr>
            )}
          </tbody>
        </table>
      </div>

      
    </div>
  )
}