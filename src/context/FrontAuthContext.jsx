import { createContext, useState, useContext, useEffect, useRef } from 'react'
import { API_URL, WS_KEY } from '../api/config'
import { fetchCustomerSecureKey } from '../services/customerWorkflowService'

const FrontAuthContext = createContext(null)

export function FrontAuthProvider({ children }) {
  const [customer, setCustomer] = useState(
    () => JSON.parse(sessionStorage.getItem('fo_customer') || 'null')
  )
  const secureKeyFetchDone = useRef(false)

  useEffect(() => {
    secureKeyFetchDone.current = false
  }, [customer?.id])

  // Si session sans secure_key (anciennes sessions) : compléter une fois via webservice
  useEffect(() => {
    if (!customer?.id || customer.secureKey || secureKeyFetchDone.current) return
    secureKeyFetchDone.current = true
    ;(async () => {
      try {
        const secureKey = await fetchCustomerSecureKey(customer.id)
        if (!secureKey) return
        const next = { ...customer, secureKey }
        setCustomer(next)
        sessionStorage.setItem('fo_customer', JSON.stringify(next))
      } catch (e) {
        console.error(e)
        secureKeyFetchDone.current = false
      }
    })()
  }, [customer])

  async function login(email, password) {
    const res = await fetch(
      `${API_URL}/customers?ws_key=${WS_KEY}&display=full&filter[email]=${encodeURIComponent(email)}`
    )
    if (!res.ok) throw new Error('Erreur serveur')

    const xmlText = await res.text()
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml')
    const found = xml.querySelector('customer')

    if (!found) throw new Error('Email introuvable')

    if (!password) throw new Error('Mot de passe requis')

    const c = {
      id: found.querySelector('id')?.textContent?.trim(),
      firstName: found.querySelector('firstname')?.textContent?.trim(),
      lastName: found.querySelector('lastname')?.textContent?.trim(),
      email: found.querySelector('email')?.textContent?.trim(),
      // Obligatoire pour PaymentModule::validateOrder (cart.secure_key doit correspondre au client)
      secureKey: found.querySelector('secure_key')?.textContent?.trim() || '',
    }

    setCustomer(c)
    sessionStorage.setItem('fo_customer', JSON.stringify(c))
    return c
  }

  function logout() {
    setCustomer(null)
    sessionStorage.removeItem('fo_customer')
  }

  return (
    <FrontAuthContext.Provider value={{ customer, login, logout }}>
      {children}
    </FrontAuthContext.Provider>
  )
}

export function useFrontAuth() {
  return useContext(FrontAuthContext)
}
