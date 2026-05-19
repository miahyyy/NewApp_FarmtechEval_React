import { API_URL, WS_KEY } from '../api/config'
import { escapeXml } from './api/xml'

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders?ws_key=${WS_KEY}&display=full`)
  if (!res.ok) throw new Error('Erreur commandes : ' + res.status)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

  return Array.from(xml.querySelectorAll('order')).map(order => ({
    id:         order.querySelector(':scope > id')?.textContent?.trim(),
    reference:  order.querySelector(':scope > reference')?.textContent?.trim(),
    customerId: order.querySelector(':scope > id_customer')?.textContent?.trim(),
    payment:    order.querySelector(':scope > payment')?.textContent?.trim(),
    state:      order.querySelector(':scope > current_state')?.textContent?.trim(),
    totalPaid:  parseFloat(order.querySelector(':scope > total_paid_tax_incl')?.textContent?.trim() || 0).toFixed(2),
    shipping:   parseFloat(order.querySelector(':scope > total_shipping_tax_incl')?.textContent?.trim() || 0).toFixed(2),
    dateAdd:    order.querySelector(':scope > date_add')?.textContent?.trim(),
  }))
}

export async function getOrderStates() {
  // French comments: Récupération dynamique des états de commande
  const res = await fetch(`${API_URL}/order_states?ws_key=${WS_KEY}&display=full`)
  if (!res.ok) throw new Error('Erreur statuts : ' + res.status)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

  const map = {}
  xml.querySelectorAll('order_state').forEach(state => {
    const id    = state.querySelector(':scope > id')?.textContent?.trim()
    const name  = state.querySelector('name language[id="1"]')?.textContent?.trim()
    const color = state.querySelector(':scope > color')?.textContent?.trim() || '#888'
    if (id) map[id] = { label: name, color, id }
  })
  return map
}

export async function updateOrderState(orderId, newStateId, message = '') {
  // French comments: POST order_histories = flux officiel PrestaShop (pas de PUT current_state)
  const msgXml = message ? `<message>${escapeXml(message)}</message>` : ''
  const historyXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <order_history>
    <id_order>${orderId}</id_order>
    <id_order_state>${newStateId}</id_order_state>
    ${msgXml}
  </order_history>
</prestashop>`

  const res = await fetch(`${API_URL}/order_histories?ws_key=${WS_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: historyXml,
  })

  if (!res.ok) throw new Error('Erreur lors de la MAJ du statut de la commande')
  return true
}