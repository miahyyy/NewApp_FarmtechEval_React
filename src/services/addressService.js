/**
 * Adresses client (webservice XML) regroupees dans un seul service.
 */
import { prestashopGet, prestashopGetPath, prestashopSend, xmlText } from './prestashopXmlClient'
import { fetchDefaultShopIds, fetchFranceCountryId } from './shopContextService'
import { createResourceDocument, serializeXmlDocument, setDirectChildText } from './xmlSchemaService'

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
  if (!shop.city || !shop.postcode) {
    throw new Error('Configuration boutique incomplete : ville ou code postal manquant')
  }

  const { doc, resourceNode } = await createResourceDocument('addresses')
  setDirectChildText(doc, resourceNode, 'id_customer', customer.id)
  setDirectChildText(doc, resourceNode, 'id_country', idCountry)
  setDirectChildText(doc, resourceNode, 'id_state', '0')
  setDirectChildText(doc, resourceNode, 'alias', alias)
  setDirectChildText(doc, resourceNode, 'firstname', customer.firstName || '')
  setDirectChildText(doc, resourceNode, 'lastname', customer.lastName || '')
  setDirectChildText(doc, resourceNode, 'address1', address1)
  setDirectChildText(doc, resourceNode, 'city', shop.city)
  setDirectChildText(doc, resourceNode, 'postcode', shop.postcode)
  setDirectChildText(doc, resourceNode, 'phone', shop.phone || '')

  const body = serializeXmlDocument(doc)
  const responseText = await prestashopSend('POST', 'addresses', body)
  const parsedDoc = new DOMParser().parseFromString(responseText, 'text/xml')
  const newId =
    xmlText(parsedDoc, 'address > id') ||
    parsedDoc.querySelector('address')?.getAttribute('id')?.trim() ||
    parsedDoc.querySelector('id')?.textContent?.trim()
  if (!newId) throw new Error('Creation adresse : id introuvable')
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
    phone: xmlText(a, 'phone') || xmlText(a, 'phone_mobile'),
  }
}
