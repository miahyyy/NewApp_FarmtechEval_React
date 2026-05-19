/**
 * Adresses client (webservice XML) — NewApp uniquement.
 */
import { escapeXml } from './api/xml'
import { prestashopGet, prestashopGetPath, prestashopSend, xmlText } from './prestashopXmlClient'
import { fetchDefaultShopIds, fetchFranceCountryId } from './shopContextService'

export async function listCustomerAddresses(customerId) {
  const xml = await prestashopGet(
    'addresses',
    `&filter[id_customer]=${encodeURIComponent(customerId)}&display=full`
  )
  return [...xml.querySelectorAll('address')].map((a) => ({
    id: xmlText(a, 'id') || a.getAttribute('id'),
    address1: xmlText(a, 'address1'),
    alias: xmlText(a, 'alias'),
  }))
}

export async function createCustomerAddress({ customer, address1 }) {
  const [idCountry, shop] = await Promise.all([fetchFranceCountryId(), fetchDefaultShopIds()])
  const alias = `Livraison ${new Date().toISOString().slice(0, 16)}`
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <address>
    <id_customer>${escapeXml(customer.id)}</id_customer>
    <id_country>${escapeXml(idCountry)}</id_country>
    <id_state>0</id_state>
    <alias>${escapeXml(alias)}</alias>
    <firstname>${escapeXml(customer.firstName || 'Client')}</firstname>
    <lastname>${escapeXml(customer.lastName || 'Client')}</lastname>
    <address1>${escapeXml(address1)}</address1>
    <city>${escapeXml(shop.city)}</city>
    <postcode>${escapeXml(shop.postcode)}</postcode>
    <phone>0000000000</phone>
  </address>
</prestashop>`
  const responseText = await prestashopSend('POST', 'addresses', body)
  const doc = new DOMParser().parseFromString(responseText, 'text/xml')
  const newId =
    xmlText(doc, 'address > id') ||
    doc.querySelector('address')?.getAttribute('id')?.trim() ||
    doc.querySelector('id')?.textContent?.trim()
  if (!newId) throw new Error('Création adresse : id introuvable')
  return newId
}

export async function fetchAddressDisplay(addressId) {
  const doc = await prestashopGetPath(`addresses/${encodeURIComponent(addressId)}`, '&display=full')
  const a = doc.querySelector('address')
  if (!a) return null
  return {
    id: xmlText(a, 'id') || a.getAttribute('id'),
    address1: xmlText(a, 'address1'),
    city: xmlText(a, 'city'),
    postcode: xmlText(a, 'postcode'),
    firstname: xmlText(a, 'firstname'),
    lastname: xmlText(a, 'lastname'),
  }
}
