import { API_URL, WS_KEY } from '../api/config'

export async function getStocks() {
  const res = await fetch(`${API_URL}/stock_availables?ws_key=${WS_KEY}&display=full&filter[id_product_attribute]=0`)
  if (!res.ok) throw new Error('Erreur stocks : ' + res.status)

  const xmlText = await res.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'text/xml')

  // On retourne { id_product: quantity }
  const map = {}
  xml.querySelectorAll('stock_available').forEach(stock => {
    const productId = stock.querySelector(':scope > id_product')?.textContent?.trim()
    const quantity = stock.querySelector(':scope > quantity')?.textContent?.trim()
    if (productId) map[productId] = quantity
  })

  return map  // ex: { "1": "10", "2": "5", ... }
}

export async function getStocksList() {
  const stocksMap = await getStocks()
  return Object.entries(stocksMap).map(([productId, quantity]) => ({ id: productId, quantity }))
}