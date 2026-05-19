/**
 * Commande client : POST orders + lecture commandes (XML). Code NewApp uniquement.
 */
import { escapeXml } from './api/xml'
import { prestashopGet, prestashopGetPath, prestashopSend, xmlText } from './prestashopXmlClient'
import {
  fetchDefaultCarrierId,
  fetchDefaultShopIds,
  fetchEuroCurrencyDetails,
  fetchFrenchLangId,
  fetchDefaultTaxMultiplier,
  fetchInitialOrderStateId,
} from './shopContextService'

async function fetchProductForOrderLine(productId, idLang) {
  const doc = await prestashopGetPath(`products/${encodeURIComponent(productId)}`, '&display=full')
  const p = doc.querySelector('product')
  if (!p) throw new Error(`Produit ${productId} introuvable`)
  let name = ''
  const ln = p.querySelector(`name language[id="${idLang}"]`)
  if (ln) name = ln.textContent?.trim() || ''
  if (!name) {
    const any = p.querySelector('name language')
    name = any?.textContent?.trim() || 'Produit'
  }
  const priceHt = parseFloat(xmlText(p, 'price') || '0')
  const mult = await fetchDefaultTaxMultiplier()
  const priceTtc = priceHt * mult
  return {
    name,
    reference: xmlText(p, 'reference'),
    unit_price_tax_excl: priceHt.toFixed(6),
    unit_price_tax_incl: priceTtc.toFixed(6),
  }
}

export async function createPrestaOrder({
  customer,
  cartId,
  addressId,
  cartLines,
  paymentModuleName,
  paymentLabel,
}) {
  if (!cartId) throw new Error('Panier manquant')
  const [idLang, carrierId, orderStateId, euro, shop] = await Promise.all([
    fetchFrenchLangId(),
    fetchDefaultCarrierId(),
    fetchInitialOrderStateId(),
    fetchEuroCurrencyDetails(),
    fetchDefaultShopIds(),
  ])

  const ids = [...new Set(cartLines.map((l) => String(l.id || l.id_product)))]
  const productMap = {}
  await Promise.all(
    ids.map(async (pid) => {
      productMap[pid] = await fetchProductForOrderLine(pid, idLang)
    })
  )

  const orderRows = cartLines
    .map((line) => {
      const pid = String(line.id || line.id_product)
      const pq = parseInt(String(line.quantity), 10) || 0
      if (pq <= 0) return ''
      const pr = productMap[pid]
      const uex = parseFloat(pr.unit_price_tax_excl)
      const uin = parseFloat(pr.unit_price_tax_incl)
      return `
      <order_row>
        <product_id>${escapeXml(pid)}</product_id>
        <product_attribute_id>0</product_attribute_id>
        <product_quantity>${escapeXml(String(pq))}</product_quantity>
        <product_name>${escapeXml(pr.name)}</product_name>
        <product_reference>${escapeXml(pr.reference)}</product_reference>
        <product_price>${escapeXml(uex.toFixed(2))}</product_price>
        <unit_price_tax_excl>${escapeXml(uex.toFixed(6))}</unit_price_tax_excl>
        <unit_price_tax_incl>${escapeXml(uin.toFixed(6))}</unit_price_tax_incl>
      </order_row>`
    })
    .join('')

  const totalProducts = cartLines.reduce((s, line) => {
    const pid = String(line.id || line.id_product)
    const pq = parseInt(String(line.quantity), 10) || 0
    return s + parseFloat(productMap[pid].unit_price_tax_excl) * pq
  }, 0)
  const totalProductsWt = cartLines.reduce((s, line) => {
    const pid = String(line.id || line.id_product)
    const pq = parseInt(String(line.quantity), 10) || 0
    return s + parseFloat(productMap[pid].unit_price_tax_incl) * pq
  }, 0)

  const totalPaid = totalProductsWt.toFixed(2)
  const totalPaidExcl = totalProducts.toFixed(2)
  const payStr = paymentLabel || paymentModuleName

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <order>
    <id_address_delivery>${escapeXml(String(addressId))}</id_address_delivery>
    <id_address_invoice>${escapeXml(String(addressId))}</id_address_invoice>
    <id_cart>${escapeXml(String(cartId))}</id_cart>
    <id_currency>${escapeXml(euro.id)}</id_currency>
    <id_lang>${escapeXml(idLang)}</id_lang>
    <id_customer>${escapeXml(String(customer.id))}</id_customer>
    <id_carrier>${escapeXml(carrierId)}</id_carrier>
    <id_shop>${escapeXml(shop.idShop)}</id_shop>
    <id_shop_group>${escapeXml(shop.idShopGroup)}</id_shop_group>
    <current_state>${escapeXml(orderStateId)}</current_state>
    <module>${escapeXml(paymentModuleName)}</module>
    <payment>${escapeXml(payStr)}</payment>
    <total_paid>${escapeXml(totalPaid)}</total_paid>
    <total_paid_tax_incl>${escapeXml(totalPaid)}</total_paid_tax_incl>
    <total_paid_tax_excl>${escapeXml(totalPaidExcl)}</total_paid_tax_excl>
    <total_paid_real>${escapeXml(totalPaid)}</total_paid_real>
    <total_products>${escapeXml(totalProducts.toFixed(2))}</total_products>
    <total_products_wt>${escapeXml(totalProductsWt.toFixed(2))}</total_products_wt>
    <total_shipping>0</total_shipping>
    <total_shipping_tax_incl>0</total_shipping_tax_incl>
    <total_shipping_tax_excl>0</total_shipping_tax_excl>
    <conversion_rate>${escapeXml(euro.conversion_rate)}</conversion_rate>
    <valid>1</valid>
    <associations>
      <order_rows>${orderRows}</order_rows>
    </associations>
  </order>
</prestashop>`

  const responseText = await prestashopSend('POST', 'orders', body)
  const doc = new DOMParser().parseFromString(responseText, 'text/xml')
  const orderId =
    xmlText(doc, 'order > id') ||
    doc.querySelector('order')?.getAttribute('id')?.trim() ||
    ''
  if (!orderId) throw new Error('Création commande : id introuvable')
  return { orderId }
}

async function fetchOrderStatesMap() {
  const xml = await prestashopGet('order_states', '&display=full')
  const map = {}
  xml.querySelectorAll('order_state').forEach((state) => {
    const id = xmlText(state, 'id') || state.getAttribute('id')
    if (!id) return
    map[id] = {
      label: xmlText(state, 'name language[id="1"]') || xmlText(state, 'name language'),
      color: xmlText(state, 'color') || '#888',
    }
  })
  return map
}

export async function getOrdersForCustomer(customerId) {
  const ordersXml = await prestashopGet(
    'orders',
    `&display=full&filter[id_customer]=${encodeURIComponent(customerId)}`
  )
  const statesMap = await fetchOrderStatesMap()
  const orders = [...ordersXml.querySelectorAll('order')].map((order) => ({
    id: xmlText(order, 'id') || order.getAttribute('id'),
    reference: xmlText(order, 'reference'),
    customerId: xmlText(order, 'id_customer'),
    payment: xmlText(order, 'payment'),
    state: statesMap[xmlText(order, 'current_state')] || null,
    totalPaid: Number(xmlText(order, 'total_paid_tax_incl') || 0).toFixed(2),
    dateAdd: xmlText(order, 'date_add'),
  }))

  const detailsByOrder = {}
  await Promise.all(
    orders.map(async (order) => {
      const detailsXml = await prestashopGet(
        'order_details',
        `&display=full&filter[id_order]=${encodeURIComponent(order.id)}`
      )
      detailsByOrder[order.id] = [...detailsXml.querySelectorAll('order_detail')].map((d) => ({
        productName: xmlText(d, 'product_name'),
        quantity: Number(xmlText(d, 'product_quantity') || 0),
        price: Number(xmlText(d, 'unit_price_tax_incl') || 0).toFixed(2),
      }))
    })
  )

  return orders.map((order) => ({
    ...order,
    items: detailsByOrder[order.id] || [],
  }))
}
