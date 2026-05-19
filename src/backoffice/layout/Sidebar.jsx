import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const LINKS = [
  { to: '/admin',            label: 'Dashboard',      icon: '◉' },
  { to: '/admin/products',   label: 'Produits',        icon: '▤'  },
  { to: '/admin/categories', label: 'Catégories',      icon: '◫'  },
  { to: '/admin/orders',     label: 'Commandes',       icon: '◎'  },
  { to: '/admin/customers',  label: 'Clients',         icon: '◯'  },
  { to: '/admin/stocks',     label: 'Stocks',          icon: '▦'  },
  { to: '/admin/import',     label: 'Import',          icon: '↑'  },
  { to: '/admin/reset',      label: 'Réinitialisation',icon: '↺'  },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">FarmTech</div>
      <nav>
        <ul>
          {LINKS.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/admin'}
              >
                <span className="sidebar-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          ⎋ Déconnexion
        </button>
      </div>
    </aside>
  )
}