import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]   = useState({ username: 'admin', password: 'admin' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Simuler un délai authentification
    await new Promise(r => setTimeout(r, 600))

    const ok = login(form.username, form.password)
    if (ok) {
      navigate('/admin', { replace: true })
    } else {
      setError('Identifiants incorrects.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* Background effects */}
      <div className="login-bg">
        <div className="login-glow login-glow-1" />
        <div className="login-glow login-glow-2" />
      </div>

      <div className="login-box">

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-diamond">◆</span>
          <span className="login-logo-text">Farmtech NewAPP</span>
        </div>

        <div className="login-header">
          <h1 className="login-title">Backoffice</h1>
          <p className="login-subtitle">Connectez-vous pour accéder au panneau d'administration</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Identifiant</label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>Mot de passe</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-spinner" />
                Connexion…
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        <div className="login-hint">
          Par défaut : <code>admin</code> / <code>admin</code>
        </div>

      </div>
    </div>
  )
}