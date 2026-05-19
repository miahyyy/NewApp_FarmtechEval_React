/**
 * Orchestrateur checkout cote NewApp.
 *
 * On centralise ici l'enchainement PrestaShop-like :
 * panier actif -> adresse -> paiement -> creation commande.
 * Les pages React ne font alors plus de logique metier dispersee.
 */
import { createCustomerAddress, fetchAddressDisplay, listCustomerAddresses } from './addressService'
import {
  ensureCartSecureKeyMatchesCustomer,
  findLatestOpenCartId,
  linkCartToAddresses,
} from './cartService'
import { createOrder } from './orderService'
import { fetchCashOnDeliveryModulesForCheckout } from './paymentService'

export async function loadCheckoutContext(customer) {
  const [cartId, addresses, paymentModules] = await Promise.all([
    findLatestOpenCartId(customer.id),
    listCustomerAddresses(customer.id),
    fetchCashOnDeliveryModulesForCheckout(),
  ])

  return {
    cartId,
    addresses,
    paymentModules,
  }
}

export async function attachAddressToActiveCart({ customer, customerSecureKey, addressId }) {
  const cartId = await findLatestOpenCartId(customer.id)
  if (!cartId) {
    throw new Error('Panier introuvable : ajoutez des articles avant de continuer')
  }

  if (customerSecureKey) {
    await ensureCartSecureKeyMatchesCustomer(cartId, customerSecureKey)
  }

  await linkCartToAddresses(cartId, addressId, customerSecureKey)
  return {
    cartId,
    addressId,
    address: await fetchAddressDisplay(addressId),
  }
}

export async function ensureCheckoutAddress({ customer, customerSecureKey, preferredAddressId = null }) {
  const addresses = await listCustomerAddresses(customer.id)
  const addressId = preferredAddressId || addresses[0]?.id || null
  if (!addressId) {
    return {
      cartId: await findLatestOpenCartId(customer.id),
      addressId: null,
      address: null,
      addresses,
    }
  }

  const linked = await attachAddressToActiveCart({ customer, customerSecureKey, addressId })
  return {
    ...linked,
    addresses,
  }
}

export async function createCheckoutAddress({ customer, customerSecureKey, address1 }) {
  const addressId = await createCustomerAddress({ customer, address1 })
  return attachAddressToActiveCart({ customer, customerSecureKey, addressId })
}

export async function submitCheckoutOrder({
  customer,
  customerSecureKey,
  paymentModuleName,
  paymentLabel,
  preferredAddressId = null,
}) {
  const checkoutState = await ensureCheckoutAddress({
    customer,
    customerSecureKey,
    preferredAddressId,
  })

  if (!checkoutState.cartId) {
    throw new Error('Panier introuvable')
  }

  if (!checkoutState.addressId) {
    throw new Error('Adresse de livraison manquante')
  }

  return createOrder({
    customer,
    cartId: checkoutState.cartId,
    addressId: checkoutState.addressId,
    paymentModuleName,
    paymentLabel,
    customerSecureKey,
  })
}