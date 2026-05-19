import Sidebar from './Sidebar'

export default function BackLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}