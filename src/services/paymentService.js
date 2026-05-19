/**
 * Moyens de paiement (checkout) regroupes dans un seul service.
 * Detection dynamique : lecture des modules actifs, puis repli sur les commandes existantes.
 * Aucun module n'est hardcode : si rien n'est detecte, on remonte une erreur.
 */
import { prestashopGet, xmlText } from './prestashopXmlClient'

function isCashOnDeliveryModuleName(name) {
  const n = (name || '').toLowerCase()
  return n.includes('cashondelivery') || n.includes('cash_on_delivery')
}

function humanizeModuleName(name) {
  return (name || '').replace(/^ps_/i, '').replace(/_/g, ' ')
}

function pickLabelFromModule(node) {
  const displayName = xmlText(node, 'display_name') || xmlText(node, 'name')
  return displayName ? humanizeModuleName(displayName) : 'Paiement'
}

async function fetchCashOnDeliveryFromModules() {
  // Lecture des modules actifs si la ressource est autorisee par la cle WS.
  const xml = await prestashopGet('modules', '&display=full&filter[active]=1')
  const out = []
  for (const m of xml.querySelectorAll('module')) {
    const name = (xmlText(m, 'name') || '').trim()
    if (!name || !isCashOnDeliveryModuleName(name)) continue
    out.push({
      name,
      label: pickLabelFromModule(m),
    })
  }
  return out
}

async function fetchCashOnDeliveryFromOrders() {
  // Repli dynamique : module detecte via les commandes existantes.
  const xml = await prestashopGet('orders', '&display=[module]&sort=[id_DESC]&limit=0,100')
  const seen = new Set()
  const out = []
  for (const o of xml.querySelectorAll('order')) {
    const name = (xmlText(o, 'module') || '').trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    if (!isCashOnDeliveryModuleName(name)) continue
    out.push({
      name,
      label: humanizeModuleName(name),
    })
  }
  return out
}

/**
 * @returns {Promise<{ name: string, label: string }[]>}
 * Selectionne uniquement le COD, mais detection 100% dynamique.
 */
export async function fetchCashOnDeliveryModulesForCheckout() {
  try {
    const mods = await fetchCashOnDeliveryFromModules()
    if (mods.length) return mods
  } catch (e) {
    // Si la ressource modules est interdite, on tente orders.
    console.warn('Modules WS indisponibles, repli sur orders', e)
  }

  const fromOrders = await fetchCashOnDeliveryFromOrders()
  if (fromOrders.length) return fromOrders

  // Aucun module COD detecte dynamiquement : on stoppe pour respecter l'interdiction de hardcode.
  throw new Error('Aucun module de paiement COD detecte via l\'API PrestaShop')
}
