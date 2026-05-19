import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FrontAuthProvider } from './context/FrontAuthContext'
import { CartProvider } from './context/CartContext'
import FrontRoutes from './frontoffice/FrontRoutes'
import BackRoutes from './backoffice/BackRoutes'
import ProductList from './components/products/ProductList'
import ResetPage from './components/reset/ResetPage'
import './App.css'

function App() {
  return (
    <div className="layout">
      <AuthProvider>
        <FrontAuthProvider>
          <CartProvider>
            <main className="main-content">
              <Routes>
                <Route path="/admin/*" element={<BackRoutes />} />
                <Route path="/produits" element={<ProductList />} />
                <Route path="/reset" element={<ResetPage />} />
                <Route path="/*" element={<FrontRoutes />} />
              </Routes>
            </main>
          </CartProvider>
        </FrontAuthProvider>
      </AuthProvider>
    </div>
  )
}

export default App