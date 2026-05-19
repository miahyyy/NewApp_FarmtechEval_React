import { API_URL, WS_KEY } from '../api/config'

// ─── Liste complète des clients ───────────────────────────
export async function getCustomers() {
  const res = await fetch(`${API_URL}/customers?ws_key=${WS_KEY}&display=full`)
  if (!res.ok) throw new Error('Erreur customers : ' + res.status)

  const xmlText = await res.text()
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml')

  return Array.from(xml.querySelectorAll('customers > customer')).map(customer => ({
    id:           customer.querySelector(':scope > id')?.textContent?.trim(),
    socialTitle:  customer.querySelector('id_gender')?.textContent?.trim() === '1' ? 'MR' : 'MRS',
    firstName:    customer.querySelector('firstname')?.textContent?.trim() || '—',
    lastName:     customer.querySelector('lastname')?.textContent?.trim() || '—',
    email:        customer.querySelector('email')?.textContent?.trim() || '—',
    group:        getGroupLabel(customer.querySelector('id_default_group')?.textContent?.trim()),
    registration: customer.querySelector('date_add')?.textContent?.trim() || '—',
  }))
}

// ─── Map { id: 'Prénom Nom' } pour les commandes ─────────
export async function getCustomersMap() {
  const customers = await getCustomers()
  const map = {}
  customers.forEach(c => { map[c.id] = `${c.firstName} ${c.lastName}` })
  return map
}

// ─── Helper groupe ────────────────────────────────────────
function getGroupLabel(groupId) {
  if (groupId === '1') return 'Visitor'
  if (groupId === '2') return 'Guest'
  return 'Customer'
}