import { useEffect, useState } from 'react'
import { getCustomers } from '../../services/customerService'  // ← corrigé
import { deleteById } from '../../services/resetService'
import ActionButtons from '../common/ActionButtons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import CustomerViewModal from './CustomerViewModal'
import CustomerEditModal from './CustomerEditModal'

function Customers() {
  const [customers, setCustomers]           = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [viewCustomer, setViewCustomer]     = useState(null)
  const [editCustomer, setEditCustomer]     = useState(null)
  const [deleteId, setDeleteId]             = useState(null)

  const [filters, setFilters] = useState({
    id: '',
    socialTitle: '',
    firstName: '',
    lastName: '',
    email: '',
    group: '',
    registrationFrom: '',
    registrationTo: ''
  })

  useEffect(() => {
    getCustomers()
      .then(data => {
        setCustomers(data)
        setFilteredCustomers(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = () => {
    const result = customers.filter(customer => {
      const matchId            = customer.id.toString().includes(filters.id)
      const matchSocialTitle   = filters.socialTitle === '' || customer.socialTitle === filters.socialTitle
      const matchFirstName     = customer.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
      const matchLastName      = customer.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
      const matchEmail         = customer.email.toLowerCase().includes(filters.email.toLowerCase())
      const matchGroup         = filters.group === '' || customer.group === filters.group
      const customerDate       = new Date(customer.registration)
      const fromDate           = filters.registrationFrom ? new Date(filters.registrationFrom) : null
      const toDate             = filters.registrationTo ? new Date(filters.registrationTo) : null
      const matchFromDate      = !fromDate || customerDate >= fromDate
      const matchToDate        = !toDate || customerDate <= toDate
      return matchId && matchSocialTitle && matchFirstName && matchLastName && matchEmail && matchGroup && matchFromDate && matchToDate
    })
    setFilteredCustomers(result)
  }

  async function handleDelete(id) {
    try {
      await deleteById('customers', id)
      setCustomers(prev => prev.filter(c => c.id !== id))
      setFilteredCustomers(prev => prev.filter(c => c.id !== id))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function handleSaved(updated) {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
    setFilteredCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  if (loading) return <p>Chargement...</p>
  if (error)   return <p style={{ color: 'red' }}>Erreur : {error}</p>

  return (
    <div>
      <h1 className="page-title">Customers ({filteredCustomers.length})</h1>

      {viewCustomer && (
        <CustomerViewModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
        />
      )}
      {editCustomer && (
        <CustomerEditModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          id={deleteId}
          entityName="le client"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <table className="product-table">
        <thead>
          <tr>
            <th><input type="checkbox" /></th>
            <th>ID</th>
            <th>Social title</th>
            <th>First name</th>
            <th>Last name</th>
            <th>Email address</th>
            <th>Group</th>
            <th>Registration</th>
            <th>Actions</th>
          </tr>

          {/* Filtres */}
          <tr>
            <th><input type="checkbox" /></th>
            <th>
              <input type="text" name="id" value={filters.id} onChange={handleFilterChange} placeholder="Search" />
            </th>
            <th>
              <select name="socialTitle" value={filters.socialTitle} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="MR">MR</option>
                <option value="MRS">MRS</option>
              </select>
            </th>
            <th>
              <input type="text" name="firstName" value={filters.firstName} onChange={handleFilterChange} placeholder="Search" />
            </th>
            <th>
              <input type="text" name="lastName" value={filters.lastName} onChange={handleFilterChange} placeholder="Search" />
            </th>
            <th>
              <input type="text" name="email" value={filters.email} onChange={handleFilterChange} placeholder="Search" />
            </th>
            <th>
              <select name="group" value={filters.group} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="Visitor">Visitor</option>
                <option value="Customer">Customer</option>
                <option value="Guest">Guest</option>
              </select>
            </th>
            <th>
              <input type="date" name="registrationFrom" value={filters.registrationFrom} onChange={handleFilterChange} />
              <input type="date" name="registrationTo" value={filters.registrationTo} onChange={handleFilterChange} />
            </th>
            <th>
              <button className="btn-save" onClick={handleSearch}>Search</button>
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredCustomers.map((customer, index) => (
            <tr key={`${customer.id}-${index}`}>
              <td><input type="checkbox" /></td>
              <td>{customer.id}</td>
              <td>{customer.socialTitle}</td>
              <td>{customer.firstName}</td>
              <td>{customer.lastName}</td>
              <td>{customer.email}</td>
              <td>
                <span className={`product-status ${customer.group === 'Customer' ? 'active' : 'default'}`}>
                  {customer.group}
                </span>
              </td>
              <td>{new Date(customer.registration).toLocaleDateString()}</td>
              <td>
                <ActionButtons
                  onView={() => setViewCustomer(customer)}
                  onEdit={() => setEditCustomer(customer)}
                  onDelete={() => setDeleteId(customer.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Customers