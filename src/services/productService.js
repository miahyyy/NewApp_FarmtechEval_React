import { API_URL, WS_KEY } from '../api/config'

export async function getProducts() {
  const res = await fetch(`${API_URL}/products?ws_key=${WS_KEY}&display=full`)
  if (!res.ok) throw new Error('Erreur produits : ' + res.status)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

 return Array.from(xml.querySelectorAll('products > product')).map(p => ({
  id: p.querySelector(':scope > id')?.textContent?.trim(),  // ← :scope = uniquement l'id direct
  name:      p.querySelector('name language[id="1"]')?.textContent?.trim() || 'Sans nom',
  reference: p.querySelector('reference')?.textContent?.trim() || '—',
  category:  p.querySelector('id_category_default')?.textContent?.trim() || '—',
  price:     parseFloat(p.querySelector('price')?.textContent?.trim() || 0).toFixed(2),
  priceTTC:  (parseFloat(p.querySelector('price')?.textContent?.trim() || 0) * 1.20).toFixed(2),
  quantity:  p.querySelector('quantity')?.textContent?.trim() || '0',
  imageId:   p.querySelector('id_default_image')?.textContent?.trim(),
  productId: p.querySelector(':scope > id')?.textContent?.trim(),
}))
}