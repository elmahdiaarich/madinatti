const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendResetPasswordEmail } = require("../services/mailService");
const { OAuth2Client } = require("google-auth-library");
const { cloudinary } = require("../config/cloudinary");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeOptional(value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  return normalized || null;
}

// Inscription
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      city,
      role,
      companyName,
      companyWebsite,
    } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = role || "citizen";

    if (!String(name || "").trim()) {
      return res.status(400).json({ message: "Nom requis" });
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return res.status(400).json({ message: "Email invalide" });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: "Mot de passe trop court" });
    }
    if (!String(phone || "").trim()) {
      return res.status(400).json({ message: "Telephone requis" });
    }
    if (!String(city || "").trim()) {
      return res.status(400).json({ message: "Ville requise" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Validation business
    if (normalizedRole === "business" && !String(companyName || "").trim()) {
      return res.status(400).json({ message: "Nom de la société requis" });
    }

    // Récupérer le rôle
    const userRole = await prisma.role.findUnique({
      where: { name: normalizedRole },
    });

    if (!userRole) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Upload logo si présent
    let companyLogoUrl = null;
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "madinatti/logos",
                transformation: [{ width: 300, height: 300, crop: "limit" }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              },
            )
            .end(req.file.buffer);
        });
        companyLogoUrl = result.secure_url;
      } catch (uploadError) {
        console.warn("Company logo upload skipped:", uploadError.message);
      }
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizeOptional(phone),
        city: normalizeOptional(city),
        profileCompleted: true,
        roleId: userRole.id,
        companyName: normalizedRole === "business" ? String(companyName).trim() : null,
        companyWebsite: normalizedRole === "business" ? normalizeOptional(companyWebsite) : null,
        companyLogo: normalizedRole === "business" ? companyLogoUrl : null,
      },
    });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: userRole.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Compte créé avec succès",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole.name,
      },
    });
  } catch (error) {
    console.error("register error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Cet email est deja utilise" });
    }
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        subscriptions: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: "Compte désactivé" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const activeSubscription = user.subscriptions?.[0] || null;

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        companyName: user.companyName,
        companyLogo: user.companyLogo,
        companyWebsite: user.companyWebsite,
        role: user.role.name,
        subscription: activeSubscription
          ? {
              ...activeSubscription,
              plan: {
                ...activeSubscription.plan,
                price: Number(activeSubscription.plan.price),
              },
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Déconnexion
const logout = async (req, res) => {
  res.status(200).json({ message: "Déconnexion réussie" });
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(email, resetLink);

    res.status(200).json({ message: "Lien de réinitialisation généré" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token },
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Token invalide" });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Token expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    res.status(200).json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Google login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      const role = await prisma.role.findUnique({
        where: { name: "citizen" },
      });

      user = await prisma.user.create({
        data: {
          name,
          email,
          password: null,
          phone: null,
          city: null,
          avatar: picture || null,
          roleId: role.id,
        },
      });
    }

    const tokenJwt = jwt.sign(
      { userId: user.id, role: user.role?.name || "citizen" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      token: tokenJwt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        roleId: user.roleId,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Google login failed" });
  }
};

// Complete profile
const completeProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone, city, role, avatar, companyName, companyWebsite } = req.body;

    const roleData = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleData) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    // Validation business
    if (role === "business" && !companyName) {
      return res.status(400).json({ message: "Nom de l'entreprise requis" });
    }

    // Upload logo si présent
    let companyLogoUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "madinatti/logos",
              transformation: [{ width: 300, height: 300, crop: "limit" }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(req.file.buffer);
      });
      companyLogoUrl = result.secure_url;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        city,
        avatar,
        roleId: roleData.id,
        profileCompleted: true,
        companyName: role === "business" ? companyName : null,
        companyWebsite: role === "business" ? companyWebsite : null,
        companyLogo: role === "business" ? companyLogoUrl : null,
      },
    });

    const newToken = jwt.sign(
      { userId: user.id, role: roleData.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Profil complété avec succès",
      token: newToken,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Get me
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        avatar: true,
        profileCompleted: true,
        isActive: true,
        companyName: true,
        companyLogo: true,
        companyWebsite: true,
        createdAt: true,
        role: {
          select: { name: true }, // ← on récupère le nom du rôle
        },
        subscriptions: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            planId: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                durationDays: true,
                maxListings: true,
                maxPhotos: true,
                canBoost: true,
                canSponsor: true,
                hasBadge: true,
                hasStatistics: true,
                hasChat: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Compte désactivé" });
    }

    const activeSubscription = user.subscriptions?.[0] || null;
    const { subscriptions, ...safeUser } = user;

    res.json({
      user: {
        ...safeUser,
        role: user.role.name, // ← "business" | "citizen" | "admin"
        subscription: activeSubscription
          ? {
              ...activeSubscription,
              plan: {
                ...activeSubscription.plan,
                price: Number(activeSubscription.plan.price),
              },
            }
          : null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/auth/me — updates allowed fields only
const updateMe = async (req, res) => {
  try {
    const {
      name,
      phone,
      city,
      companyName,
      companyWebsite,
      currentPassword,
      newPassword,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    const data = {};

    if (name?.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = phone;
    if (city !== undefined) data.city = city;
    if (companyName !== undefined) data.companyName = companyName;
    if (companyWebsite !== undefined) data.companyWebsite = companyWebsite;

    // ✅ Avatar upload via Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "avatars",
              transformation: [
                { width: 200, height: 200, crop: "fill", gravity: "face" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(req.file.buffer);
      });
      data.avatar = result.secure_url;
    }

    if (currentPassword && newPassword) {
      const bcrypt = require("bcryptjs");
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid)
        return res
          .status(400)
          .json({ message: "Mot de passe actuel incorrect" });
      if (newPassword.length < 6)
        return res.status(400).json({
          message: "Le nouveau mot de passe doit faire au moins 6 caractères",
        });
      data.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        avatar: true,
        companyName: true,
        companyWebsite: true,
        companyLogo: true,
        profileCompleted: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });

    res.json({ user: { ...updated, role: updated.role.name } });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
  completeProfile,
  getMe,
  updateMe,
};
