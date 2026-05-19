/**
 * Panier PrestaShop via webservice XML (NewApp uniquement).
 * Regroupe toute la logique Cart pour rester aligne sur PrestaShop.
 */
import { prestashopGet, prestashopGetPath, prestashopSend, xmlText } from './prestashopXmlClient'
import {
  fetchDefaultCarrierId,
  fetchDefaultLanguageId,
  fetchDefaultShopIds,
  fetchEuroCurrencyDetails,
} from './shopContextService'
import {
  appendAssociationRow,
  createResourceDocument,
  resetAssociationContainer,
  serializeXmlDocument,
  setDirectChildText,
} from './xmlSchemaService'

export async function isCartConvertedToOrder(cartId) {
  const xml = await prestashopGet('orders', `&filter[id_cart]=${encodeURIComponent(cartId)}&display=[id]`)
  return xml.querySelectorAll('order').length > 0
}

export async function findLatestOpenCartId(customerId) {
  const xml = await prestashopGet(
    'carts',
    `&filter[id_customer]=${encodeURIComponent(customerId)}&sort=[id_DESC]&display=[id]`
  )
  for (const node of xml.querySelectorAll('cart')) {
    const id = xmlText(node, 'id') || node.getAttribute('id')?.trim()
    if (!id) continue
    if (!(await isCartConvertedToOrder(id))) return id
  }
  return null
}

export async function fetchCartDocument(cartId) {
  return prestashopGetPath(`carts/${encodeURIComponent(cartId)}`, '&display=full')
}

export async function getCartSnapshot(cartId) {
  const doc = await fetchCartDocument(cartId)
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) throw new Error('Panier introuvable')
  return {
    id: xmlText(cartEl, 'id') || cartEl.getAttribute('id') || '',
    customerId: xmlText(cartEl, 'id_customer'),
    addressDeliveryId: xmlText(cartEl, 'id_address_delivery') || '0',
    addressInvoiceId: xmlText(cartEl, 'id_address_invoice') || '0',
    carrierId: xmlText(cartEl, 'id_carrier') || '0',
    currencyId: xmlText(cartEl, 'id_currency'),
    langId: xmlText(cartEl, 'id_lang'),
    secureKey: xmlText(cartEl, 'secure_key'),
    lines: [...doc.querySelectorAll('associations cart_rows cart_row')].map((row) => ({
      id_product: xmlText(row, 'id_product'),
      id_product_attribute: xmlText(row, 'id_product_attribute') || '0',
      id_address_delivery: xmlText(row, 'id_address_delivery') || xmlText(cartEl, 'id_address_delivery') || '0',
      quantity: parseInt(xmlText(row, 'quantity'), 10) || 0,
    })),
  }
}

// Aligne la secure_key du panier sur celle du client (requis pour validateOrder).
function applyCustomerSecureKeyToCartDom(doc, customerSecureKey) {
  if (!customerSecureKey) return
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) return
  let el = cartEl.querySelector(':scope > secure_key')
  if (!el) {
    el = doc.createElement('secure_key')
    cartEl.appendChild(el)
  }
  el.textContent = customerSecureKey
}

function normalizeCartLines(lines, addressId = '0') {
  return lines
    .map((line) => ({
      id_product: String(line.id_product ?? line.id ?? ''),
      id_product_attribute: String(line.id_product_attribute ?? '0'),
      id_address_delivery: String(line.id_address_delivery ?? addressId ?? '0'),
      quantity: Math.max(0, parseInt(String(line.quantity), 10) || 0),
    }))
    .filter((line) => line.id_product && line.quantity > 0)
}

export async function postNewCart({ customerId, lines, customerSecureKey }) {
  const [euro, idLang, shop, idCarrier] = await Promise.all([
    fetchEuroCurrencyDetails(),
    fetchDefaultLanguageId(),
    fetchDefaultShopIds(),
    fetchDefaultCarrierId(),
  ])
  const normalizedLines = normalizeCartLines(lines)
  const { doc, resourceNode } = await createResourceDocument('carts')
  setDirectChildText(doc, resourceNode, 'id_address_delivery', '0')
  setDirectChildText(doc, resourceNode, 'id_address_invoice', '0')
  setDirectChildText(doc, resourceNode, 'id_currency', euro.id)
  setDirectChildText(doc, resourceNode, 'id_customer', customerId)
  setDirectChildText(doc, resourceNode, 'id_guest', '0')
  setDirectChildText(doc, resourceNode, 'id_lang', idLang)
  setDirectChildText(doc, resourceNode, 'id_shop_group', shop.idShopGroup)
  setDirectChildText(doc, resourceNode, 'id_shop', shop.idShop)
  setDirectChildText(doc, resourceNode, 'id_carrier', idCarrier)
  setDirectChildText(doc, resourceNode, 'recyclable', '0')
  setDirectChildText(doc, resourceNode, 'gift', '0')
  setDirectChildText(doc, resourceNode, 'mobile_theme', '0')
  if (customerSecureKey) {
    setDirectChildText(doc, resourceNode, 'secure_key', customerSecureKey)
  }

  const cartRows = resetAssociationContainer(doc, resourceNode, 'cart_rows')
  normalizedLines.forEach((line) => {
    appendAssociationRow(doc, cartRows, 'cart_row', line)
  })

  const body = serializeXmlDocument(doc)
  const responseText = await prestashopSend('POST', 'carts', body)
  const parsedDoc = new DOMParser().parseFromString(responseText, 'text/xml')
  const newId =
    xmlText(parsedDoc, 'cart > id') ||
    parsedDoc.querySelector('cart')?.getAttribute('id')?.trim() ||
    parsedDoc.querySelector('id')?.textContent?.trim()
  if (!newId) throw new Error('Creation panier : id introuvable')
  return newId
}

export async function putCartDocument(cartDom) {
  const root = cartDom.documentElement
  if (!root || root.nodeName.toLowerCase() !== 'prestashop') {
    throw new Error('Racine prestashop attendue')
  }
  const cartEl = root.querySelector('cart')
  const id = cartEl ? xmlText(cartEl, 'id') || cartEl.getAttribute('id') : ''
  if (!id) throw new Error('Id panier manquant')
  const body = serializeXmlDocument(cartDom)
  await prestashopSend('PUT', `carts/${encodeURIComponent(id)}`, body)
  return id
}

export async function replaceCartLines(cartId, lines, customerSecureKey) {
  const doc = await fetchCartDocument(cartId)
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) throw new Error('cart introuvable')

  applyCustomerSecureKeyToCartDom(doc, customerSecureKey)

  const defAddr = xmlText(cartEl, 'id_address_delivery') || '0'
  const rowsContainer = resetAssociationContainer(doc, cartEl, 'cart_rows')

  const normalized = normalizeCartLines(lines, defAddr)
  normalized.forEach((line) => {
    appendAssociationRow(doc, rowsContainer, 'cart_row', line)
  })
  await putCartDocument(doc)
}

export async function linkCartToAddresses(cartId, addressId, customerSecureKey) {
  const doc = await fetchCartDocument(cartId)
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) throw new Error('Panier introuvable')

  applyCustomerSecureKeyToCartDom(doc, customerSecureKey)

  const setField = (name, val) => {
    let el = cartEl.querySelector(`:scope > ${name}`)
    if (!el) {
      el = doc.createElement(name)
      cartEl.appendChild(el)
    }
    el.textContent = val
  }
  setField('id_address_delivery', String(addressId))
  setField('id_address_invoice', String(addressId))
  doc.querySelectorAll('associations cart_rows cart_row').forEach((row) => {
    let el = row.querySelector('id_address_delivery')
    if (!el) {
      el = doc.createElement('id_address_delivery')
      row.appendChild(el)
    }
    el.textContent = String(addressId)
  })
  await putCartDocument(doc)
}

// Avant POST orders : forcer la coherence secure_key panier / client (validateOrder).
export async function ensureCartSecureKeyMatchesCustomer(cartId, customerSecureKey) {
  if (!cartId || !customerSecureKey) return
  const doc = await fetchCartDocument(cartId)
  const cur = xmlText(doc.querySelector('prestashop > cart') || doc.querySelector('cart'), 'secure_key')
  if (cur === customerSecureKey) return
  applyCustomerSecureKeyToCartDom(doc, customerSecureKey)
  await putCartDocument(doc)
}

// PrestaShop genere les OrderDetail a partir de la langue du panier.
// Si le panier pointe vers une langue sans traduction produit, product_name devient vide.
// On force donc la langue du panier sur la langue par defaut reelle de la boutique.
export async function ensureCartLanguage(cartId, targetLangId) {
  if (!cartId || !targetLangId) return
  const doc = await fetchCartDocument(cartId)
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) throw new Error('Panier introuvable')
  const currentLangId = xmlText(cartEl, 'id_lang')
  if (currentLangId === String(targetLangId)) return

  let langNode = cartEl.querySelector(':scope > id_lang')
  if (!langNode) {
    langNode = doc.createElement('id_lang')
    cartEl.appendChild(langNode)
  }
  langNode.textContent = String(targetLangId)
  await putCartDocument(doc)
}

export async function mergeProductLineIntoCart({
  customerId,
  cartIdOrNull,
  idProduct,
  qtyDelta,
  idProductAttribute = 0,
  customerSecureKey,
}) {
  let cartId = cartIdOrNull
  if (!cartId) cartId = await findLatestOpenCartId(customerId)
  const lines = []
  if (cartId) {
    const d = await fetchCartDocument(cartId)
    for (const row of d.querySelectorAll('associations cart_rows cart_row')) {
      lines.push({
        id_product: xmlText(row, 'id_product'),
        id_product_attribute: xmlText(row, 'id_product_attribute') || '0',
        quantity: parseInt(xmlText(row, 'quantity'), 10) || 0,
      })
    }
  }
  const key = `${idProduct}_${idProductAttribute}`
  const idx = lines.findIndex((l) => `${l.id_product}_${l.id_product_attribute || '0'}` === key)
  if (idx >= 0) lines[idx].quantity += qtyDelta
  else if (qtyDelta > 0) {
    lines.push({
      id_product: String(idProduct),
      id_product_attribute: String(idProductAttribute),
      quantity: qtyDelta,
    })
  }
  const cleaned = lines.filter((l) => l.quantity > 0)
  if (!cartId) {
    if (cleaned.length === 0) return null
    return postNewCart({ customerId, lines: cleaned, customerSecureKey })
  }
  await replaceCartLines(cartId, cleaned, customerSecureKey)
  return cartId
}

export async function loadCartLinesForDisplay(cartId, productCatalog) {
  const doc = await fetchCartDocument(cartId)
  const out = []
  for (const row of doc.querySelectorAll('associations cart_rows cart_row')) {
    const pid = xmlText(row, 'id_product')
    const qty = parseInt(xmlText(row, 'quantity'), 10) || 0
    const def = productCatalog.find((p) => p.id === pid)
    if (def && qty > 0) out.push({ ...def, quantity: qty })
  }
  return out
}
