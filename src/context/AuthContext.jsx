import { createContext, useState, useContext } from 'react'


const AuthContext = createContext(null)

const DEFAULT_USER = { username: 'admin', password: 'admin' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(sessionStorage.getItem('bo_user') || 'null')
  )

  function login(username, password) {
    if (
      username === DEFAULT_USER.username &&
      password === DEFAULT_USER.password
    ) {
      const u = { username }
      setUser(u)
      sessionStorage.setItem('bo_user', JSON.stringify(u))
      return true
    }
    return false
  }

  function logout() {
    setUser(null)
    sessionStorage.removeItem('bo_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthContext }
export default AuthContext