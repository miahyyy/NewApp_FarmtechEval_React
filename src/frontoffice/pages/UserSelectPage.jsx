import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrontAuth } from '../../context/FrontAuthContext'
import { getCustomers } from '../../services/customerService'

export default function UserSelectPage() {
  const { customer, loginAsCustomer, loginAsAnonymous } = useFrontAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (customer) {
      navigate('/home', { replace: true })
    }
  }, [customer, navigate])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    getCustomers()
      .then((list) => {
        if (!alive) return
        setUsers(list)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err?.message || 'Impossible de charger les utilisateurs')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      return name.includes(q) || email.includes(q) || String(u.id).includes(q)
    })
  }, [search, users])

  async function handleSelect(user) {
    await loginAsCustomer({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      secureKey: user.secureKey || '',
    })
    navigate('/home', { replace: true })
  }

  async function handleAnonymous() {
    await loginAsAnonymous()
    navigate('/home', { replace: true })
  }

  return (
    <div className="fo-user-select">
      <div className="fo-user-select-header">
        <h1 className="fo-user-title">Choisir un utilisateur</h1>
        <p className="fo-user-subtitle">
          Selectionnez un compte client pour acceder a la boutique.
        </p>
      </div>

      <div className="fo-user-toolbar">
        <input
          className="fo-user-search"
          type="text"
          placeholder="Rechercher par nom, email ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="fo-user-ghost" type="button" onClick={handleAnonymous}>
          Utilisateur anonyme
        </button>
      </div>

      {loading && (
        <div className="fo-user-loading">
          <div className="fo-spinner" />
          Chargement des utilisateurs...
        </div>
      )}

      {error && !loading && (
        <div className="fo-user-error">{error}</div>
      )}

      {!loading && !error && (
        <div className="fo-user-grid">
          {filtered.length === 0 ? (
            <div className="fo-user-empty">Aucun utilisateur trouve.</div>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="fo-user-card">
                <div className="fo-user-avatar">{(u.firstName || '?')[0]}</div>
                <div className="fo-user-info">
                  <div className="fo-user-name">{u.firstName} {u.lastName}</div>
                  <div className="fo-user-meta">ID {u.id} · {u.email || '—'}</div>
                </div>
                <button className="fo-user-action" type="button" onClick={() => handleSelect(u)}>
                  Se connecter
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
