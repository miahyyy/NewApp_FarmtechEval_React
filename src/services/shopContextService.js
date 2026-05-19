/**
 * Données boutique lues via webservice (ids dynamiques : devise EUR, langue FR, pays FR, etc.).
 * Tout le code reste dans NewApp.
 */
import { prestashopGet, xmlText } from './prestashopXmlClient'

let cache = {}

function remember(key, fn) {
  if (cache[key] != null) return Promise.resolve(cache[key])
  return fn().then((v) => {
    cache[key] = v
    return v
  })
}

export async function fetchEuroCurrencyDetails() {
  return remember('currency_eur', async () => {
    const xml = await prestashopGet('currencies', '&filter[iso_code]=EUR&display=full')
    const c = xml.querySelector('currency')
    if (!c) throw new Error('Devise EUR introuvable')
    return {
      id: xmlText(c, 'id'),
      conversion_rate: xmlText(c, 'conversion_rate') || '1',
    }
  })
}

export async function fetchFrenchLangId() {
  return remember('lang_fr', async () => {
    const xml = await prestashopGet('languages', '&filter[iso_code]=fr&display=[id]')
    let id = xml.querySelector('language > id')?.textContent?.trim()
    if (!id) {
      const fb = await prestashopGet('languages', '&display=[id,iso_code]')
      for (const l of fb.querySelectorAll('language')) {
        if (xmlText(l, 'iso_code').toLowerCase() === 'fr') {
          id = xmlText(l, 'id')
          break
        }
      }
    }
    if (!id) throw new Error('Langue FR introuvable')
    return id
  })
}

export async function fetchFranceCountryId() {
  return remember('country_fr', async () => {
    const xml = await prestashopGet('countries', '&filter[iso_code]=FR&display=[id]')
    const id = xml.querySelector('country > id')?.textContent?.trim()
    if (!id) throw new Error('Pays FR introuvable')
    return id
  })
}

export async function fetchDefaultShopIds() {
  return remember('shop', async () => {
    const xml = await prestashopGet('shops', '&display=full')
    const shop = xml.querySelector('shop')
    if (!shop) throw new Error('Aucune boutique (shops)')
    return {
      idShop: xmlText(shop, 'id'),
      idShopGroup: xmlText(shop, 'id_shop_group'),
      city: xmlText(shop, 'city') || 'Paris',
      postcode: xmlText(shop, 'zipcode') || xmlText(shop, 'postcode') || '75000',
    }
  })
}

export async function fetchDefaultTaxMultiplier() {
  return remember('tax', async () => {
    const xml = await prestashopGet('taxes', '&filter[active]=1&display=full')
    const rate = parseFloat(xml.querySelector('tax > rate')?.textContent?.trim() || '0')
    if (!Number.isFinite(rate) || rate <= 0) return 1.2
    return 1 + rate / 100
  })
}

export async function fetchDefaultCarrierId() {
  return remember('carrier', async () => {
    const xml = await prestashopGet('carriers', '&filter[active]=1&filter[deleted]=0&display=full')
    const list = [...xml.querySelectorAll('carrier')]
    const free = list.find((c) => xmlText(c, 'is_free') === '1')
    const pick = free || list[0]
    const id = pick ? xmlText(pick, 'id') : ''
    if (!id) throw new Error('Aucun transporteur actif')
    return id
  })
}

async function fetchConfigurationValue(name) {
  const xml = await prestashopGet('configurations', `&filter[name]=${encodeURIComponent(name)}&display=[value]`)
  return xml.querySelector('configuration > value')?.textContent?.trim() || ''
}

/** État initial commande : clés config Presta puis repli sur order_states */
export async function fetchInitialOrderStateId() {
  return remember('os_init', async () => {
    for (const k of ['PS_OS_COD_VALIDATION', 'PS_OS_PREPARATION', 'PS_OS_WS_PAYMENT']) {
      const v = await fetchConfigurationValue(k)
      if (v) return v
    }
    const xml = await prestashopGet('order_states', '&display=full')
    const states = [...xml.querySelectorAll('order_state')]
    const prep = states.find((s) => xmlText(s, 'template').toLowerCase() === 'preparation')
    if (prep) return xmlText(prep, 'id')
    const id = states[0] ? xmlText(states[0], 'id') : ''
    if (!id) throw new Error('Aucun order_state')
    return id
  })
}
