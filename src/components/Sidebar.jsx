import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Boutique', icon: '🏬' },
  { to: '/cart', label: 'Panier', icon: '🛒' },
  { to: '/checkout/address', label: 'Adresse', icon: '📍' },
  { to: '/checkout/payment', label: 'Paiement', icon: '💳' },
  { to: '/my-orders', label: 'Mes commandes', icon: '📦' },
  { to: '/login', label: 'Connexion', icon: '🔐' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">NewAPP</div>
      <nav>
        <ul>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
                end={link.to === '/'}
              >
                <span className="sidebar-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar