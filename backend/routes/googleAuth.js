const express = require("express")
const router = express.Router()
const prisma = require("../config/db")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library")

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body

    // 1. VERIFY GOOGLE TOKEN
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    
    const { name, email, picture } = payload
    
    // 2. CHECK USER
    let user = await prisma.user.findUnique({
        where: { email }
    })
    
    // 3. CREATE USER IF NOT EXISTS
   const userRole = await prisma.role.findUnique({
  where: { name: "citizen" }
})

if (!userRole) {
  return res.status(500).json({
    message: "Default role 'citizen' not found"
  })
}
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: null,
          avatar: picture,
          roleId: userRole.id
        }
      })
    }

    // 4. CREATE YOUR JWT
    const appToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "Google login success",
      token: appToken,
      user
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Google auth failed" })
  }
})

module.exports = router