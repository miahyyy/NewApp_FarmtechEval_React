import Sidebar from '../../components/Sidebar'
import Header from './Header'
import Footer from './Footer'

export default function FrontLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="fo-app">
        <Header />
        <main className="fo-main">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}