import { API_URL, WS_KEY } from '../api/config'

/* =========================
   SINGULAR MAP
========================= */
const SINGULAR_MAP = {
  products:         'product',
  categories:       'category',
  customers:        'customer',
  orders:           'order',
  addresses:        'address',
  manufacturers:    'manufacturer',
  suppliers:        'supplier',
  stock_availables: 'stock_available',
  carriers:         'carrier',
  currencies:       'currency',
  employees:        'employee',
  groups:           'group',
  images:           'image',
  languages:        'language',
  order_states:     'order_state',
  taxes:            'tax',
  tax_rules:        'tax_rule',
}

/* =========================
   GET SINGULAR
========================= */
function getSingular(resource) {
  return SINGULAR_MAP[resource] || resource.slice(0, -1)
}

/* =========================
   GET RESOURCE FIELDS
   via schema=blank
========================= */
export async function getResourceFields(resource) {
  try {
    const res = await fetch(
      `${API_URL}/${resource}?ws_key=${WS_KEY}&schema=blank`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xmlText = await res.text()
    console.log('XML schema reçu:', xmlText.slice(0, 500))

    const xml    = new DOMParser().parseFromString(xmlText, 'text/xml')
    const entity = getSingular(resource)
    const item   = xml.querySelector(entity)

    if (!item) {
      console.warn(`❌ Aucun élément <${entity}> trouvé`)
      return {}
    }

    const fields = {}
    Array.from(item.children).forEach(child => {
      const tag         = child.nodeName
      const isLang      = child.querySelector('language') !== null
      const hasChildren = child.children.length > 0 && !isLang

      if (!hasChildren) {
        fields[tag] = {
          label:  tag,
          xmlTag: tag,
          isLang,
        }
      }
    })

    console.log(`✔ Champs trouvés pour ${resource}:`, Object.keys(fields))
    return fields

  } catch (err) {
    console.error('❌ getResourceFields error:', err)
    return {}
  }
}

/* =========================
   BUILD XML
========================= */
function buildXml(resource, mapping, row, fields) {
  const entity = getSingular(resource)
  let fieldsXml = ''

  Object.entries(mapping).forEach(([csvCol, fieldKey]) => {
    if (!fieldKey || !fields[fieldKey]) return

    const { xmlTag, isLang } = fields[fieldKey]
    const value = (row[csvCol] || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (isLang) {
      fieldsXml += `<${xmlTag}><language id="1">${value}</language></${xmlTag}>\n    `
    } else {
      fieldsXml += `<${xmlTag}>${value}</${xmlTag}>\n    `
    }
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <${entity}>
    ${fieldsXml}
  </${entity}>
</prestashop>`
}

/* =========================
   IMPORT ONE ROW
========================= */
async function importRow(resource, mapping, row, fields) {
  const xml = buildXml(resource, mapping, row, fields)

  const res = await fetch(`${API_URL}/${resource}?ws_key=${WS_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} : ${text}`)
  }

  return true
}

/* =========================
   IMPORT ALL ROWS
========================= */
export async function importData(resource, mapping, rows, fields, onProgress) {
  const results = { success: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    try {
      await importRow(resource, mapping, rows[i], fields)
      results.success++
    } catch (err) {
      results.errors.push({ row: i + 1, message: err.message })
    }
    onProgress(i + 1, rows.length)
  }

  return results
}