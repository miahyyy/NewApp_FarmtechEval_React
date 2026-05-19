/**
 * Helpers XML bases sur les schemas vides PrestaShop.
 *
 * Le but est d'eviter les payloads incomplets ou inventes a la main.
 * On part toujours du schema officiel du webservice, puis on injecte
 * uniquement les valeurs metier necessaires avant POST/PUT.
 */
import { prestashopGet } from './prestashopXmlClient'

const blankSchemaCache = new Map()

const SINGULAR_RESOURCE_MAP = {
  addresses: 'address',
  carriers: 'carrier',
  carts: 'cart',
  configurations: 'configuration',
  countries: 'country',
  currencies: 'currency',
  customers: 'customer',
  languages: 'language',
  modules: 'module',
  order_details: 'order_detail',
  order_histories: 'order_history',
  order_payments: 'order_payment',
  order_states: 'order_state',
  orders: 'order',
  products: 'product',
  shops: 'shop',
  taxes: 'tax',
}

function getSingularResourceName(resource) {
  const singular = SINGULAR_RESOURCE_MAP[resource]
  if (!singular) {
    throw new Error(`Ressource XML non geree : ${resource}`)
  }
  return singular
}

function getSchemaRoot(doc, resource) {
  const singular = getSingularResourceName(resource)
  const root = doc.querySelector(`prestashop > ${singular}`) || doc.querySelector(singular)
  if (!root) {
    throw new Error(`Schema XML invalide pour ${resource}`)
  }
  return root
}

export async function fetchBlankSchema(resource) {
  if (!blankSchemaCache.has(resource)) {
    blankSchemaCache.set(resource, prestashopGet(resource, '&schema=blank'))
  }
  const schema = await blankSchemaCache.get(resource)
  return schema.cloneNode(true)
}

export async function createResourceDocument(resource) {
  const doc = await fetchBlankSchema(resource)
  return {
    doc,
    resourceNode: getSchemaRoot(doc, resource),
  }
}

export function ensureDirectChild(doc, parentNode, tagName) {
  let node = parentNode.querySelector(`:scope > ${tagName}`)
  if (!node) {
    node = doc.createElement(tagName)
    parentNode.appendChild(node)
  }
  return node
}

export function setDirectChildText(doc, parentNode, tagName, value) {
  const node = ensureDirectChild(doc, parentNode, tagName)
  node.textContent = value == null ? '' : String(value)
  return node
}

export function removeDirectChild(parentNode, tagName) {
  const node = parentNode.querySelector(`:scope > ${tagName}`)
  if (node) {
    node.remove()
  }
}

export function resetAssociationContainer(doc, resourceNode, containerTag) {
  const associations = ensureDirectChild(doc, resourceNode, 'associations')
  const container = ensureDirectChild(doc, associations, containerTag)
  container.replaceChildren()
  return container
}

export function appendAssociationRow(doc, containerNode, rowTag, values) {
  const row = doc.createElement(rowTag)
  Object.entries(values).forEach(([tagName, value]) => {
    const child = doc.createElement(tagName)
    child.textContent = value == null ? '' : String(value)
    row.appendChild(child)
  })
  containerNode.appendChild(row)
  return row
}

export function serializeXmlDocument(doc) {
  const serialized = new XMLSerializer().serializeToString(doc)
  return serialized.startsWith('<?xml')
    ? serialized
    : `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`
}