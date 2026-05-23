const prisma = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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

module.exports = { register, login, logout }