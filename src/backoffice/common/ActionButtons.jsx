function ActionButtons({ onView, onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button className="btn-action btn-view" onClick={onView} title="Voir">👁</button>
      <button className="btn-action btn-edit" onClick={onEdit} title="Modifier">✏️</button>
      <button className="btn-action btn-delete" onClick={onDelete} title="Supprimer">🗑</button>
    </div>
  )
}

export default ActionButtons