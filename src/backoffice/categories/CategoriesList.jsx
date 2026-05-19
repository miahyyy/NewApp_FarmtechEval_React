import { useEffect, useState } from 'react'
import { getCategoriesList } from '../../services/categoryService'
import { deleteById } from '../../services/resetService'
import ActionButtons from '../common/ActionButtons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import CategoryViewModal from './CategoryViewModal'
import CategoryEditModal from './CategoryEditModal'

function CategoriesList() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [viewCategory, setViewCategory] = useState(null)
  const [editCategory, setEditCategory] = useState(null)
  const [deleteId, setDeleteId]         = useState(null)

  useEffect(() => {
    getCategoriesList()
      .then(data => { setCategories(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function handleDelete(id) {
    try {
      await deleteById('categories', id)
      setCategories(prev => prev.filter(c => c.id !== id))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function handleSaved(updated) {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Catégories ({categories.length})</h1>

      {viewCategory && (
        <CategoryViewModal
          category={viewCategory}
          onClose={() => setViewCategory(null)}
        />
      )}
      {editCategory && (
        <CategoryEditModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          entityName="la catégorie"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Position</th>
            <th>Displayed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, index) => (
            <tr key={`${cat.id}-${index}`}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cat.description || '—'}
              </td>
              <td>{cat.position}</td>
              <td>
                <span className={`product-status ${cat.active === '1' ? 'active' : 'inactive'}`}>
                  {cat.active === '1' ? 'Oui' : 'Non'}
                </span>
              </td>
              <td>
                <ActionButtons
                  onView={() => setViewCategory(cat)}
                  onEdit={() => setEditCategory(cat)}
                  onDelete={() => setDeleteId(cat.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriesList