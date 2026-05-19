/**
 * Moyens de paiement COD pour le checkout (XML webservice uniquement, NewApp).
 *
 * La ressource webservice « modules » n’est pas disponible pour ta clé (erreur 27) :
 * on ne l’appelle plus du tout → plus de requêtes 400 dans l’onglet Réseau.
 *
 * Détection dynamique :
 * 1) Lire le champ `module` des commandes existantes (GET orders) — valeurs réelles boutique (ex. ps_cashondelivery).
 * 2) Si aucune commande COD encore : repli sur le nom technique du module natif (identique à ps_module.name pour le COD).
 */

import { prestashopGet, xmlText } from './prestashopXmlClient'

function isCashOnDeliveryModuleName(name) {
  const n = (name || '').toLowerCase()
  return n.includes('cashondelivery') || n.includes('cash_on_delivery')
}

function humanizeModuleName(name) {
  return (name || '').replace(/^ps_/i, '').replace(/_/g, ' ')
}

/**
 * @returns {Promise<{ name: string, label: string }[]>} toujours au moins une option COD pour le workflow examen.
 */
export async function fetchCashOnDeliveryModulesForCheckout() {
  try {
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
    if (out.length) return out
  } catch {
    // Pas d’accès orders ou aucune ligne : repli ci-dessous.
  }

  // Repli : nom technique du module COD natif PrestaShop (= colonne name dans ps_module pour ce module).
  return [{ name: 'ps_cashondelivery', label: 'Paiement à la livraison' }]
}
