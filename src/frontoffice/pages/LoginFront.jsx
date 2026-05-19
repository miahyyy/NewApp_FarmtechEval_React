import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useFrontAuth } from '../../context/FrontAuthContext'

export default function LoginFront() {
  const { login }   = useFrontAuth()
  const navigate    = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fo-login-wrap">
      <div className="fo-login-box">

        <div className="fo-login-header">
          <h1>Connexion</h1>
          <p>Connectez-vous avec votre compte client</p>
        </div>

        <form onSubmit={handleSubmit} className="fo-login-form">
          <div className="fo-field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
              autoFocus
            />
          </div>

          <div className="fo-field">
            <label>Mot de passe</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="fo-error">{error}</div>}

          <button type="submit" className="fo-btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="fo-login-back">
          <Link to="/">← Retour à la boutique</Link>
        </div>

      </div>
    </div>
  )
}