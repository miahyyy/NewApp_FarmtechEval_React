export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function parseXml(text) {
  return new DOMParser().parseFromString(text, 'text/xml')
}

export function getFirstId(xml, nodeName) {
  const byNode = xml.querySelector(`${nodeName} > id`)?.textContent?.trim()
  if (byNode) return byNode
  const byAttr = xml.querySelector(`${nodeName}[id]`)?.getAttribute('id')?.trim()
  if (byAttr) return byAttr
  const anyId = xml.querySelector('id')?.textContent?.trim()
  return anyId || null
}

export function getText(node, selector) {
  return node?.querySelector(selector)?.textContent?.trim() || ''
}
