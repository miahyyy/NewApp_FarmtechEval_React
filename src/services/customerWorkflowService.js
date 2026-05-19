/**
 * Données client utiles au checkout (webservice XML, NewApp uniquement).
 * La clé secure_key du client doit correspondre à celle du panier pour validateOrder (voir Order::addWs).
 */
import { prestashopGetPath, xmlText } from './prestashopXmlClient'

/** Lit la secure_key PrestaShop du client (champ customers.secure_key). */
export async function fetchCustomerSecureKey(customerId) {
  const doc = await prestashopGetPath(`customers/${encodeURIComponent(customerId)}`, '&display=[secure_key]')
  const c = doc.querySelector('customer')
  return (c && xmlText(c, 'secure_key')) || ''
}
