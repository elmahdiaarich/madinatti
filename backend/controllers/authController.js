const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendResetPasswordEmail } = require("../services/mailService");
const { OAuth2Client } = require("google-auth-library");
const { cloudinary } = require("../config/cloudinary");
const {
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
} = require("../utils/authValidation");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function normalizeOptional(value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  return normalized || null;
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function safeUser(user) {
  const subscription = user.subscriptions?.[0] || null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    city: user.city ?? null,
    avatar: user.avatar ?? null,
    companyName: user.companyName ?? null,
    companyLogo: user.companyLogo ?? null,
    companyWebsite: user.companyWebsite ?? null,
    profileCompleted: user.profileCompleted,
    isActive: user.isActive,
    createdAt: user.createdAt,
    role: user.role?.name ?? user.role ?? null,
    subscription: subscription
      ? {
          ...subscription,
          plan: subscription.plan
            ? { ...subscription.plan, price: Number(subscription.plan.price) }
            : null,
        }
      : null,
  };
}

function signAuthToken(user, roleName) {
  return jwt.sign(
    { userId: user.id, role: roleName, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function serverErrorResponse(res, error, fallbackMessage = "Erreur serveur") {
  console.error(fallbackMessage, error);
  res.status(500).json({ message: fallbackMessage });
}

// Inscription
const register = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!String(name || "").trim()) {
      return res.status(400).json({ message: "Nom requis" });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email invalide" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: PASSWORD_MESSAGE,
      });
    }
    if (!String(phone || "").trim()) {
      return res.status(400).json({ message: "Telephone requis" });
    }
    if (!String(city || "").trim()) {
      return res.status(400).json({ message: "Ville requise" });
    }
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est dÃ©jÃ  utilisÃ©" });
    }

    const userRole = await prisma.role.findUnique({ where: { name: "citizen" } });
    if (!userRole) {
      return res.status(400).json({ message: "RÃ´le invalide" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizeOptional(phone),
        city: normalizeOptional(city),
        profileCompleted: true,
        roleId: userRole.id,
      },
    });

    const token = signAuthToken(user, userRole.name);

    res.status(201).json({
      message: "Compte crÃ©Ã© avec succÃ¨s",
      token,
      user: safeUser({ ...user, role: userRole }),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Cet email est deja utilise" });
    }
    serverErrorResponse(res, error, "register error");
  }
};
// Connexion
const login = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!isValidEmail(normalizedEmail) || typeof password !== "string") {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: {
        role: true,
        subscriptions: {
          where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    // Same generic message whether the email doesn't exist or the password
    // is wrong â€” never reveal which one it was.
    const genericError = { message: "Email ou mot de passe incorrect" };

    if (!user || !user.password) {
      return res.status(400).json(genericError);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json(genericError);
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Compte dÃ©sactivÃ©" });
    }

    const token = signAuthToken(user, user.role.name);
    res.status(200).json({
      message: "Connexion rÃ©ussie",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    serverErrorResponse(res, error, "login error");
  }
};

// DÃ©connexion (client-side JWT discard â€” see report for why this doesn't
// revoke the token server-side, and when that matters)
const logout = async (req, res) => {
  res.status(200).json({ message: "DÃ©connexion rÃ©ussie" });
};

// DÃ©connexion de tous les appareils â€” actually invalidates every existing token
const logoutAll = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { tokenVersion: { increment: 1 } },
    });
    res.status(200).json({ message: "DÃ©connectÃ© de tous les appareils" });
  } catch (error) {
    serverErrorResponse(res, error, "logoutAll error");
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    // Always respond the same way, whether or not the account exists â€”
    // otherwise this endpoint becomes an email-enumeration oracle.
    const genericResponse = {
      message: "Si un compte existe avec cet email, un lien de rÃ©initialisation a Ã©tÃ© envoyÃ©.",
    };

    if (user?.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedTokenValue = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token: hashedTokenValue, expiresAt },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

      // Never let a transient email-provider failure leak account
      // existence via a 500 that a working account wouldn't produce.
      try {
        await sendResetPasswordEmail(normalizedEmail, resetLink);
      } catch (mailError) {
        console.error("sendResetPasswordEmail failed:", mailError);
      }
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    serverErrorResponse(res, error, "forgotPassword error");
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token invalide" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractÃ¨res, une lettre et un chiffre`,
      });
    }

    const hashedTokenValue = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token: hashedTokenValue },
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Token invalide" });
    }
    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return res.status(400).json({ message: "Token expirÃ©" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      // Bump tokenVersion so every JWT issued before this reset stops
      // working immediately â€” otherwise a stolen-and-then-reset account
      // is still accessible via the old token until it expires naturally.
      data: { password: hashedPassword, tokenVersion: { increment: 1 } },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    res.status(200).json({ message: "Mot de passe modifiÃ© avec succÃ¨s" });
  } catch (error) {
    serverErrorResponse(res, error, "resetPassword error");
  }
};

// Google login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID || typeof token !== "string") {
      return res.status(400).json({ message: "Jeton Google invalide" });
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json({ message: "Connexion Google invalide" });
    }
    const payload = ticket.getPayload();
    if (!payload?.sub || payload.email_verified !== true || !isValidEmail(normalizeEmail(payload.email))) {
      return res.status(401).json({ message: "Le compte Google doit utiliser une adresse email vÃ©rifiÃ©e" });
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const linked = await prisma.oAuthProvider.findFirst({
      where: { provider: "google", providerId: payload.sub },
      include: { user: { include: { role: true } } },
    });

    let user = linked?.user || null;
    if (!user) {
      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        include: { role: true },
      });
      if (existing) {
        if (!existing.isActive) return res.status(403).json({ message: "Compte désactivé" });
        if (existing.role?.name !== "citizen") {
          return res.status(409).json({
            message: "La liaison Google nécessite une procédure administrateur pour ce compte.",
            code: "GOOGLE_ACCOUNT_LINK_REQUIRES_AUTH",
          });
        }

        const existingGoogle = await prisma.oAuthProvider.findFirst({
          where: { userId: existing.id, provider: "google" },
        });
        if (existingGoogle && existingGoogle.providerId !== payload.sub) {
          return res.status(409).json({
            message: "Un autre compte Google est déjà lié à cet utilisateur.",
            code: "GOOGLE_PROVIDER_CONFLICT",
          });
        }
        if (!existingGoogle) {
          try {
            await prisma.oAuthProvider.create({
              data: { userId: existing.id, provider: "google", providerId: payload.sub },
            });
          } catch (error) {
            if (error.code === "P2002") {
              return res.status(409).json({
                message: "Ce compte Google est déjà lié à un autre utilisateur.",
                code: "GOOGLE_PROVIDER_CONFLICT",
              });
            }
            throw error;
          }
        }
        user = existing;
      }
      if (!user) {
        const citizenRole = await prisma.role.findUnique({ where: { name: "citizen" } });
        if (!citizenRole) {
          return res.status(500).json({ message: "Configuration des rÃ´les indisponible" });
        }

        user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            name: String(payload.name || normalizedEmail.split("@")[0]).trim(),
            email: normalizedEmail,
            password: null,
            avatar: payload.picture || null,
            roleId: citizenRole.id,
            profileCompleted: false,
          },
          include: { role: true },
        });
        await tx.oAuthProvider.create({
          data: { userId: created.id, provider: "google", providerId: payload.sub },
        });
        return created;
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Compte dÃ©sactivÃ©" });
    }

    const token_ = signAuthToken(user, user.role.name);
    return res.json({ message: "Google login success", token: token_, user: safeUser(user) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Ce compte Google est dÃ©jÃ  liÃ© Ã  un compte" });
    }
    if (error.message?.includes("Wrong number of segments") || error.message?.includes("Invalid token")) {
      return res.status(401).json({ message: "Connexion Google invalide" });
    }
    serverErrorResponse(res, error, "Google auth failed");
  }
};

// Complete profile
const completeProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone, city } = req.body;

    const data = {
      phone: normalizeOptional(phone),
      city: normalizeOptional(city),
      profileCompleted: true,
    };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "avatars", transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }] },
            (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
          )
          .end(req.file.buffer);
      });
      data.avatar = result.secure_url;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true, city: true, avatar: true,
        profileCompleted: true, isActive: true, createdAt: true,
        role: { select: { name: true } },
      },
    });

    res.json({ message: "Profil complÃ©tÃ© avec succÃ¨s", user: safeUser(user) });
  } catch (error) {
    serverErrorResponse(res, error, "completeProfile error");
  }
};

// Get me
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, city: true, avatar: true,
        profileCompleted: true, isActive: true, companyName: true, companyLogo: true,
        companyWebsite: true, createdAt: true,
        role: { select: { name: true } },
        subscriptions: {
          where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true, status: true, startedAt: true, expiresAt: true, planId: true,
            plan: {
              select: {
                id: true, name: true, price: true, durationDays: true, maxListings: true,
                maxPhotos: true, canBoost: true, canSponsor: true, hasBadge: true,
                hasStatistics: true, hasChat: true,
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
      return res.status(403).json({ message: "Compte dÃ©sactivÃ©" });
    }

    res.json({ user: safeUser(user) });
  } catch (error) {
    serverErrorResponse(res, error, "getMe error");
  }
};

// PATCH /api/auth/me â€” updates allowed fields only
const updateMe = async (req, res) => {
  try {
    const { name, phone, city, companyName, companyWebsite, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const data = {};

    if (name?.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = normalizeOptional(phone);
    if (city !== undefined) data.city = normalizeOptional(city);
    if (companyName !== undefined) data.companyName = normalizeOptional(companyName);
    if (companyWebsite !== undefined) {
      const trimmed = normalizeOptional(companyWebsite);
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        return res.status(400).json({ message: "L'URL du site doit commencer par http:// ou https://" });
      }
      data.companyWebsite = trimmed;
    }

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "avatars", transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }] },
            (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
          )
          .end(req.file.buffer);
      });
      data.avatar = result.secure_url;
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mot de passe actuel et nouveau requis" });
      }
      if (!user.password) {
        return res.status(400).json({ message: "Ce compte n'a pas de mot de passe (connectÃ© via Google)" });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          message: `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractÃ¨res, une lettre et un chiffre`,
        });
      }
      data.password = await bcrypt.hash(newPassword, 10);
      // Changing the password invalidates every other existing session.
      data.tokenVersion = { increment: 1 };
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true, city: true, avatar: true,
        companyName: true, companyWebsite: true, companyLogo: true, profileCompleted: true,
        isActive: true, createdAt: true, tokenVersion: true,
        role: { select: { name: true } },
        subscriptions: {
          where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });

    const replacementToken = data.password
      ? signAuthToken(updated, updated.role.name)
      : undefined;
    res.json({
      user: safeUser(updated),
      ...(replacementToken ? { token: replacementToken } : {}),
    });
  } catch (error) {
    serverErrorResponse(res, error, "updateMe error");
  }
};

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  googleLogin,
  completeProfile,
  getMe,
  updateMe,
};

