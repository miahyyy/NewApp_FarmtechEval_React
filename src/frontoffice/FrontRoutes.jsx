import { Routes, Route } from 'react-router-dom'
import FrontLayout  from './layout/FrontLayout'
import HomePage     from './pages/HomePage'
import ProductPage  from './pages/ProductPage'
import CartPage     from './pages/CartPage'
import CheckoutAddressPage from './pages/CheckoutAddressPage'
import CheckoutPaymentPage from './pages/CheckoutPaymentPage'
import MyOrdersPage from './pages/MyOrdersPage'
import LoginFront   from './pages/LoginFront'

export default function FrontRoutes() {
  return (
    <FrontLayout>
      <Routes>
        <Route index                element={<HomePage />} />
        <Route path="product/:id"   element={<ProductPage />} />
        <Route path="cart"          element={<CartPage />} />
        <Route path="checkout/address" element={<CheckoutAddressPage />} />
        <Route path="checkout/payment" element={<CheckoutPaymentPage />} />
        <Route path="my-orders"     element={<MyOrdersPage />} />
        <Route path="login"         element={<LoginFront />} />
      </Routes>
    </FrontLayout>
  )
}