import { API_URL, WS_KEY } from '../api/config'

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories?ws_key=${WS_KEY.categories}&display=full`)
  if (!res.ok) throw new Error('Erreur catégories : ' + res.status)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

  // On retourne un objet { id: nom } pour chercher rapidement
  const map = {}
  xml.querySelectorAll('category').forEach(cat => {
    const id = cat.querySelector('id')?.textContent?.trim()
    const name = cat.querySelector('name language[id="1"]')?.textContent?.trim()
    if (id && name) map[id] = name
  })

  return map
}

export async function getCategoriesList() {
  const categoriesMap = await getCategories()
  return Object.entries(categoriesMap).map(([id, name]) => ({ id, name }))
}