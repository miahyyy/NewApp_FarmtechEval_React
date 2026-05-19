function DeleteConfirmModal({ id, entityName, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Confirmer la suppression</h3>
        <p>Voulez-vous vraiment supprimer <strong>{entityName} #{id}</strong> ?</p>
        <p style={{ fontSize: '13px', color: '#888' }}>Cette action est irréversible.</p>
        <div className="modal-actions">
          <button className="btn-danger" onClick={onConfirm}>Supprimer</button>
          <button className="btn-cancel" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal