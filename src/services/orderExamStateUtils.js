/**
 * Filtre des états commande pour le back-office (sujet examen), sans id figé.
 * Exclut « paiement à distance accepté » / remote payment accepted.
 */

export function normalizeStateLabel(label) {
  return (label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function isOrderStateSelectableForExam(label) {
  const n = normalizeStateLabel(label)
  if (!n) return false
  if (n.includes('remote') && n.includes('payment') && n.includes('accepted')) return false
  if (n.includes('distance') && n.includes('paiement') && n.includes('accept')) return false

  const paid =
    (n.includes('paiement') && n.includes('accept') && !n.includes('distance')) ||
    (n.includes('payment') && n.includes('accepted') && !n.includes('remote'))

  const fail =
    n.includes('echec') ||
    n.includes('chec') ||
    (n.includes('erreur') && n.includes('paiement')) ||
    (n.includes('error') && n.includes('payment')) ||
    n.includes('failed')

  const cancel = n.includes('annul') || n.includes('canceled') || n.includes('cancelled')

  return paid || fail || cancel
}
