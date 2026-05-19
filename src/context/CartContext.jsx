import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useFrontAuth } from './FrontAuthContext'
import { getProducts } from '../services/productService'
import { fetchCustomerSecureKey } from '../services/customerWorkflowService'
import {
  findLatestOpenCartId,
  loadCartLinesForDisplay,
  mergeProductLineIntoCart,
  replaceCartLines,
} from '../services/cartWorkflowService'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { customer } = useFrontAuth()
  const [cartItems, setCartItems] = useState([])
  const [cartId, setCartId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /** secure_key client : nécessaire pour aligner le panier (validateOrder). */
  const resolveCustomerSecureKey = useCallback(async () => {
    if (!customer?.id) return ''
    if (customer.secureKey) return customer.secureKey
    return fetchCustomerSecureKey(customer.id)
  }, [customer])

  const refreshCart = useCallback(async () => {
    if (!customer) {
      setCartItems([])
      setCartId(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const catalog = await getProducts()
      const openId = await findLatestOpenCartId(customer.id)
      if (!openId) {
        setCartId(null)
        setCartItems([])
        return
      }
      setCartId(openId)
      setCartItems(await loadCartLinesForDisplay(openId, catalog))
    } catch (e) {
      console.error(e)
      setError(e.message || 'Erreur panier')
      setCartItems([])
      setCartId(null)
    } finally {
      setLoading(false)
    }
  }, [customer])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!customer) return
      setLoading(true)
      setError(null)
      try {
        const customerSecureKey = await resolveCustomerSecureKey()
        const newId = await mergeProductLineIntoCart({
          customerId: customer.id,
          cartIdOrNull: null,
          idProduct: product.id,
          qtyDelta: quantity,
          customerSecureKey,
        })
        setCartId(newId)
        await refreshCart()
      } catch (e) {
        console.error(e)
        setError(e.message || 'Erreur ajout panier')
      } finally {
        setLoading(false)
      }
    },
    [customer, refreshCart, resolveCustomerSecureKey]
  )

  const removeFromCart = useCallback(
    async (productId) => {
      if (!customer) return
      setLoading(true)
      setError(null)
      try {
        const customerSecureKey = await resolveCustomerSecureKey()
        const catalog = await getProducts()
        const activeId = await findLatestOpenCartId(customer.id)
        if (!activeId) return
        const current = await loadCartLinesForDisplay(activeId, catalog)
        const next = current
          .filter((i) => i.id !== productId)
          .map((i) => ({ id_product: i.id, quantity: i.quantity }))
        await replaceCartLines(activeId, next, customerSecureKey)
        await refreshCart()
      } catch (e) {
        console.error(e)
        setError(e.message || 'Erreur suppression')
      } finally {
        setLoading(false)
      }
    },
    [customer, refreshCart, resolveCustomerSecureKey]
  )

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (!customer) return
      if (quantity <= 0) {
        await removeFromCart(productId)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const customerSecureKey = await resolveCustomerSecureKey()
        const catalog = await getProducts()
        const activeId = await findLatestOpenCartId(customer.id)
        if (!activeId) return
        const current = await loadCartLinesForDisplay(activeId, catalog)
        const next = current
          .map((i) =>
            i.id === productId ? { id_product: i.id, quantity } : { id_product: i.id, quantity: i.quantity }
          )
          .filter((i) => i.quantity > 0)
        await replaceCartLines(activeId, next, customerSecureKey)
        await refreshCart()
      } catch (e) {
        console.error(e)
        setError(e.message || 'Erreur quantité')
      } finally {
        setLoading(false)
      }
    },
    [customer, refreshCart, removeFromCart, resolveCustomerSecureKey]
  )

  const clearCart = useCallback(() => {
    setCartItems([])
    setCartId(null)
    setError(null)
  }, [])

  const total = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
  const count = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart: cartItems,
        cartId,
        loading,
        error,
        refreshCart,
        resolveCustomerSecureKey,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}

export default CartContext
