/**
 * Client HTTP pour l’API webservice PrestaShop (XML) — utilisé uniquement par NewApp.
 */
import { API_URL, WS_KEY } from '../api/config'
import { parseXml } from './api/xml'

/** Construit l’URL d’une ressource PrestaShop (NewApp → proxy /api, pas le cœur PHP modifié). */
export function buildPrestaUrl(resource, query = '') {
  const suffix = query.startsWith('&') ? query : query ? `&${query}` : ''
  return `${API_URL}/${resource}?ws_key=${WS_KEY}${suffix}`
}

/** GET → document XML parsé */
export async function prestashopGet(resource, query = '') {
  const res = await fetch(buildPrestaUrl(resource, query))
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`PrestaShop GET ${resource} → HTTP ${res.status}\n${text.slice(0, 800)}`)
  }
  return parseXml(text)
}

/** GET avec chemin type carts/12 */
export async function prestashopGetPath(path, query = '') {
  const res = await fetch(buildPrestaUrl(path, query))
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`PrestaShop GET ${path} → HTTP ${res.status}\n${text.slice(0, 800)}`)
  }
  return parseXml(text)
}

/** POST ou PUT avec corps XML */
export async function prestashopSend(method, resource, xmlBody) {
  const url = buildPrestaUrl(resource, '')
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'text/xml' },
    body: xmlBody,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`PrestaShop ${method} ${resource} → HTTP ${res.status}\n${text.slice(0, 1200)}`)
  }
  return text
}

/** Texte d’un sous-nœud */
export function xmlText(node, selector) {
  if (!node) return ''
  const el = node.querySelector(selector)
  return el?.textContent?.trim() ?? ''
}
