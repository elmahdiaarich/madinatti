import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import axios from "axios"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      try {
        // send user to backend
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
          {
            name: user.name,
            email: user.email,
            image: user.image,
          }
        )

        return true
      } catch (error) {
        console.log("Google login backend error:", error)
        return false
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }