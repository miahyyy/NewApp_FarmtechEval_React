import { API_URL, WS_KEY } from '../api/config'

export async function getResourceIds(resource) {
  const res = await fetch(`${API_URL}/${resource}?ws_key=${WS_KEY}`)
  if (!res.ok) throw new Error(`Erreur récupération IDs : ${res.status}`)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

  return Array.from(xml.querySelectorAll(`${resource.slice(0, -1)} > id, ${resource} > id`))
    .map(el => el.textContent.trim())
    .filter(Boolean)
}

export async function dumpResource(resource) {
  const res = await fetch(`${API_URL}/${resource}?ws_key=${WS_KEY}&display=full`)
  if (!res.ok) throw new Error(`Erreur dump : ${res.status}`)

  const xmlText = await res.text()

  // Téléchargement automatique du fichier XML
  const blob = new Blob([xmlText], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dump_${resource}_${new Date().toISOString().slice(0, 10)}.xml`
  a.click()
  URL.revokeObjectURL(url)
}

export async function deleteById(resource, id) {
  const res = await fetch(`${API_URL}/${resource}/${id}?ws_key=${WS_KEY}`, {
    method: 'DELETE',
  })
  console.log(`DELETE ${resource}/${id} → ${res.status}`)
  if (!res.ok) throw new Error(`Erreur suppression ${id} : ${res.status}`)
  return id
}

export async function fetchResources() {
  return [
    { name: 'products' },
    { name: 'categories' },
    { name: 'customers' },
    { name: 'orders' },
    { name: 'stock_availables' },
  ]
}

export async function resetResources(resources) {
  await Promise.all(resources.map(async (resource) => {
    const ids = await getResourceIds(resource)
    await Promise.all(ids.map(id => deleteById(resource, id)))
  }))
}