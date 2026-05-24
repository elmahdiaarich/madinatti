import { AuthProvider } from '../context/AuthContext'
import DevTools from '../components/shared/DevTools'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'
import './globals.css'

export const metadata = {
  title: 'Madinatti',
  description: 'Plateforme locale multi-services',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <DevTools />
        </AuthProvider>
      </body>
    </html>
  )
}