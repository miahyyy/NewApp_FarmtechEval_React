import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BackLayout    from './layout/BackLayout'
import LoginPage     from './auth/LoginPage'
import Dashboard     from './dashboard/Dashboard'
import ProductList   from './products/ProductList'
import CategoriesList from './categories/CategoriesList'
import OrderList     from './orders/OrderList'
import Customers     from './customers/Customers'
import StockList     from './stocks/StockList'
import ResetPage     from './reset/ResetPage'
import ImportPage    from './import/ImportPage'
import MappingPage   from './import/MappingPage'

// Protège les routes — redirige vers login si non connecté
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/admin/login" replace />
}

export default function BackRoutes() {
  return (
    <Routes>
      {/* Route publique */}
      <Route path="login" element={<LoginPage />} />

      {/* Routes protégées */}
      <Route path="*" element={
        <PrivateRoute>
          <BackLayout>
            <Routes>
              <Route index            element={<Dashboard />} />
              <Route path="products"  element={<ProductList />} />
              <Route path="categories"element={<CategoriesList />} />
              <Route path="orders"    element={<OrderList />} />
              <Route path="customers" element={<Customers />} />
              <Route path="stocks"    element={<StockList />} />
              <Route path="reset"     element={<ResetPage />} />
              <Route path="import"    element={<ImportPage />} />
              <Route path="import/mapping" element={<MappingPage />} />
            </Routes>
          </BackLayout>
        </PrivateRoute>
      } />
    </Routes>
  )
}