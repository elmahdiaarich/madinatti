import { AuthProvider } from '../context/AuthContext'
import DevTools from '../components/shared/DevTools'
import Navbar from '../components/shared/Navbar'
import Footer from '../components/shared/Footer'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Script from "next/script"
import './globals.css'

export const metadata = {
  title: 'Madinatti',
  description: 'Plateforme locale multi-services',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://apis.google.com" />  
          <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </head>
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