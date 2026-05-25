const prisma = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { sendResetPasswordEmail } = require('../services/mailService')

// Inscription
const register = async (req, res) => {
  try {
    const { name, email, password, phone, city, role } = req.body

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    }

    // Récupérer le rôle
    const userRole = await prisma.role.findUnique({
      where: { name: role || 'citizen' }
    })

    if (!userRole) {
      return res.status(400).json({ message: 'Rôle invalide' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        roleId: userRole.id
      }
    })

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: userRole.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole.name
      }
    })

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    })

    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(400).json({ message: 'Compte désactivé' })
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name
      }
    })

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

// Déconnexion
const logout = async (req, res) => {
  res.status(200).json({ message: 'Déconnexion réussie' })
}
// forgot password 
const forgotPassword = async (req, res) => {
   try {

    const { email } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable'
      })
    }

    // Générer token aléatoire
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Expiration 1 heure
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60
    )
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id
        }
      })
    // Sauvegarder token DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    })

    // Lien reset
    const resetLink =
      `http://localhost:3000/auth/reset-password?token=${resetToken}`

    await sendResetPasswordEmail(
    email,
    resetLink
  )

    res.status(200).json({
      message: 'Lien de réinitialisation généré'
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      message: 'Erreur serveur'
    })
  }
}
// reset password
const resetPassword = async (req, res) => {

  try {

    const { token, password } = req.body

    const resetToken =
    await prisma.passwordResetToken.findFirst({
    where: { token }
    })

    if (!resetToken) {
      return res.status(400).json({
        message: 'Token invalide'
      })
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({
        message: 'Token expiré'
      })
    }

    const hashedPassword =
      await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        password: hashedPassword
      }
    })

    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id
      }
    })

    res.status(200).json({
      message: 'Mot de passe modifié avec succès'
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      message: 'Erreur serveur'
    })
  }
}
module.exports = { register, login, logout, forgotPassword, resetPassword }