/**
 * Panier PrestaShop via webservice XML (NewApp uniquement).
 * IMPORTANT : PaymentModule::validateOrder compare customer.secure_key et cart.secure_key (voir Order::addWs).
 * Les paniers créés par WS doivent donc porter la même secure_key que le client.
 */
import { escapeXml } from './api/xml'
import { prestashopGet, prestashopGetPath, prestashopSend, xmlText } from './prestashopXmlClient'
import {
  fetchDefaultCarrierId,
  fetchDefaultShopIds,
  fetchEuroCurrencyDetails,
  fetchFrenchLangId,
} from './shopContextService'

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

/** Aligne la secure_key du document panier sur celle du client (requis pour validateOrder). */
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

function buildCartRowsXml(lines) {
  return lines
    .filter((l) => l.quantity > 0)
    .map(
      (l) => `
    <cart_row>
      <id_product>${escapeXml(l.id_product)}</id_product>
      <id_product_attribute>${escapeXml(l.id_product_attribute ?? '0')}</id_product_attribute>
      <id_address_delivery>0</id_address_delivery>
      <quantity>${escapeXml(String(l.quantity))}</quantity>
    </cart_row>`
    )
    .join('')
}

export async function postNewCart({ customerId, lines, customerSecureKey }) {
  const [euro, idLang, shop, idCarrier] = await Promise.all([
    fetchEuroCurrencyDetails(),
    fetchFrenchLangId(),
    fetchDefaultShopIds(),
    fetchDefaultCarrierId(),
  ])
  const skXml = customerSecureKey ? `<secure_key>${escapeXml(customerSecureKey)}</secure_key>` : ''
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <cart>
    <id_address_delivery>0</id_address_delivery>
    <id_address_invoice>0</id_address_invoice>
    <id_currency>${escapeXml(euro.id)}</id_currency>
    <id_customer>${escapeXml(customerId)}</id_customer>
    <id_guest>0</id_guest>
    <id_lang>${escapeXml(idLang)}</id_lang>
    <id_shop_group>${escapeXml(shop.idShopGroup)}</id_shop_group>
    <id_shop>${escapeXml(shop.idShop)}</id_shop>
    <id_carrier>${escapeXml(idCarrier)}</id_carrier>
    ${skXml}
    <recyclable>0</recyclable>
    <gift>0</gift>
    <mobile_theme>0</mobile_theme>
    <associations>
      <cart_rows>${buildCartRowsXml(lines)}</cart_rows>
    </associations>
  </cart>
</prestashop>`
  const responseText = await prestashopSend('POST', 'carts', body)
  const doc = new DOMParser().parseFromString(responseText, 'text/xml')
  const newId =
    xmlText(doc, 'cart > id') ||
    doc.querySelector('cart')?.getAttribute('id')?.trim() ||
    doc.querySelector('id')?.textContent?.trim()
  if (!newId) throw new Error('Création panier : id introuvable')
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
  const serialized = new XMLSerializer().serializeToString(root)
  const body = serialized.startsWith('<?xml')
    ? serialized
    : `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`
  await prestashopSend('PUT', `carts/${encodeURIComponent(id)}`, body)
  return id
}

export async function replaceCartLines(cartId, lines, customerSecureKey) {
  const doc = await fetchCartDocument(cartId)
  const cartEl = doc.querySelector('prestashop > cart') || doc.querySelector('cart')
  if (!cartEl) throw new Error('cart introuvable')

  applyCustomerSecureKeyToCartDom(doc, customerSecureKey)

  const defAddr = xmlText(cartEl, 'id_address_delivery') || '0'
  let assoc = cartEl.querySelector('associations')
  if (!assoc) {
    assoc = doc.createElement('associations')
    cartEl.appendChild(assoc)
  }
  let rowsContainer = assoc.querySelector('cart_rows')
  if (!rowsContainer) {
    rowsContainer = doc.createElement('cart_rows')
    assoc.appendChild(rowsContainer)
  }
  rowsContainer.replaceChildren()

  const normalized = lines
    .map((l) => ({
      id_product: String(l.id_product ?? l.id ?? ''),
      id_product_attribute: String(l.id_product_attribute ?? '0'),
      quantity: Math.max(0, parseInt(String(l.quantity), 10) || 0),
    }))
    .filter((l) => l.id_product && l.quantity > 0)

  for (const line of normalized) {
    const row = doc.createElement('cart_row')
    for (const tag of ['id_product', 'id_product_attribute', 'id_address_delivery', 'quantity']) {
      const n = doc.createElement(tag)
      if (tag === 'id_address_delivery') n.textContent = defAddr
      else if (tag === 'id_product') n.textContent = line.id_product
      else if (tag === 'id_product_attribute') n.textContent = line.id_product_attribute
      else n.textContent = String(line.quantity)
      row.appendChild(n)
    }
    rowsContainer.appendChild(row)
  }
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

/** Avant POST orders : forcer la cohérence secure_key panier / client (validateOrder). */
export async function ensureCartSecureKeyMatchesCustomer(cartId, customerSecureKey) {
  if (!cartId || !customerSecureKey) return
  const doc = await fetchCartDocument(cartId)
  const cur = xmlText(doc.querySelector('prestashop > cart') || doc.querySelector('cart'), 'secure_key')
  if (cur === customerSecureKey) return
  applyCustomerSecureKeyToCartDom(doc, customerSecureKey)
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
