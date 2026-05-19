import { Link, useNavigate } from 'react-router-dom'
import { useCart }      from '../../context/CartContext'
import { useFrontAuth } from '../../context/FrontAuthContext'

export default function Header() {
  const { count }              = useCart()
  const { customer, logout }   = useFrontAuth()
  const navigate               = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="fo-header">
      <div className="fo-header-inner">

        {/* Logo */}
        <Link to="/" className="fo-logo">
          <span className="fo-logo-diamond">◆</span>
          NewAPP
        </Link>

        {/* Nav */}
        <nav className="fo-nav">
          <Link to="/">Boutique</Link>
          {customer && <Link to="/my-orders">Mes commandes</Link>}
        </nav>

        {/* Right */}
        <div className="fo-header-right">

          {/* Cart */}
          <Link to="/cart" className="fo-cart-btn">
            <span className="fo-cart-icon">🛒</span>
            {count > 0 && (
              <span className="fo-cart-count">{count}</span>
            )}
          </Link>

          {/* User */}
          {customer ? (
            <div className="fo-user-menu">
              <span className="fo-user-name">
                {customer.firstName}
              </span>
              <button className="fo-logout-btn" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="fo-login-btn">
              Se connecter
            </Link>
          )}

        </div>
      </div>
    </header>
  )
}