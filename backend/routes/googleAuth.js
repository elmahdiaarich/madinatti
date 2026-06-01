const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    // 1. VERIFY GOOGLE TOKEN
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // 2. CHECK USER
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. GET DEFAULT ROLE
    const userRole = await prisma.role.findUnique({
      where: { name: "citizen" },
    });

    if (!userRole) {
      return res.status(500).json({
        message: "Default role 'citizen' not found",
      });
    }

    // 4. CREATE USER IF NOT EXISTS
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: null,
          avatar: picture,
          roleId: userRole.id,
          profileCompleted: false,
        },
      });
    }

    // 🔥 5. GET FULL USER (IMPORTANT FIX)
    const fullUser = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    // 🔥 6. GENERATE JWT WITH REAL DATA
    const appToken = jwt.sign(
      {
        userId: fullUser.id,
        role: fullUser.role.name,
        profileCompleted: fullUser.profileCompleted,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. RESPONSE CLEAN
  res.json({
  message: "Google login success",
  token: appToken,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    roleId: user.roleId,
    profileCompleted: user.profileCompleted
  }
});
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Google auth failed",
    });
  }
});

module.exports = router;