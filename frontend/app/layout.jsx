import { AuthProvider } from '../context/AuthContext'
import DevTools from '../components/shared/DevTools'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './globals.css'

export const metadata = {
  title: 'Madinatti',
  description: 'Plateforme locale multi-services',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>

          <AuthProvider>
            <Navbar />
            {children}
            <Footer />
            <DevTools />
          </AuthProvider>

        </GoogleOAuthProvider>
      </body>
    </html>
  )
}