/**
 * Export PDF cote NewApp sans toucher a PrestaShop.
 *
 * Le navigateur gere la generation PDF via la boite d'impression.
 * Cela permet un export propre sans ajouter de logique serveur ni modifier
 * le backoffice PrestaShop.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderOrderRows(items) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.reference || '—')}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.price)} €</td>
        </tr>`
    )
    .join('')
}

export function exportOrderToPdf(order, customerName, stateLabel) {
  const popup = window.open('', '_blank', 'width=900,height=700')
  if (!popup) {
    throw new Error('Impossible d\'ouvrir la fenetre d\'export PDF')
  }

  const address = order.deliveryAddress
  const addressBlock = address
    ? `${escapeHtml(address.firstname)} ${escapeHtml(address.lastname)}<br />${escapeHtml(address.address1)}<br />${escapeHtml(address.postcode)} ${escapeHtml(address.city)}`
    : 'Adresse indisponible'

  popup.document.write(`
    <html>
      <head>
        <title>Commande ${escapeHtml(order.reference || order.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
          h1, h2 { margin-bottom: 8px; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .small { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Commande ${escapeHtml(order.reference || order.id)}</h1>
        <div class="meta">
          <div class="card"><strong>Client</strong><br />${escapeHtml(customerName)}</div>
          <div class="card"><strong>Statut</strong><br />${escapeHtml(stateLabel)}</div>
          <div class="card"><strong>Paiement</strong><br />${escapeHtml(order.payment || '—')}</div>
          <div class="card"><strong>Date</strong><br />${escapeHtml(order.dateAdd?.slice(0, 10) || '—')}</div>
          <div class="card"><strong>Total</strong><br />${escapeHtml(order.totalPaid)} €</div>
          <div class="card"><strong>Adresse livraison</strong><br />${addressBlock}</div>
        </div>

        <h2>Produits</h2>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Reference</th>
              <th>Quantite</th>
              <th>Prix TTC</th>
            </tr>
          </thead>
          <tbody>
            ${renderOrderRows(order.items || [])}
          </tbody>
        </table>

        <p class="small">Document genere depuis NewApp a partir des donnees XML PrestaShop.</p>
      </body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.print()
}