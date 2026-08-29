const prisma = require("../config/db");
const { cities: moroccoCities } = require("morocco-cities");
const { createNotification } = require("./notificationController");

const MAX_LIMIT = 50;
const clampLimit = (limit) => Math.min(parseInt(limit) || 10, MAX_LIMIT);

const citiesByRegion = moroccoCities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// Filtres communs recherche + débloqués (diplôme, expérience, contrat, ville/région, mots-clés)
function buildCandidateWhere({ educationLevel, experienceLevel, contractType, city, region, search, categorySlug }) {
  let locationFilter = {};
  if (city) {
    locationFilter = {
      OR: [
        { user: { city: { contains: city, mode: "insensitive" } } },
        { mobilityCity: { contains: city, mode: "insensitive" } },
      ],
    };
  } else if (region) {
    const citiesInRegion = citiesByRegion[region] || [];
    locationFilter = {
      OR: [
        { user: { city: { in: citiesInRegion } } },
        { mobilityRegion: region },
      ],
    };
  }

  return {
    ...locationFilter,
    ...(educationLevel && { educationLevel }),
    ...(experienceLevel && { experienceLevel }),
    ...(contractType && { desiredContractTypes: { has: contractType } }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(search && {
      OR: [
        { headline: { contains: search, mode: "insensitive" } },
        { currentPosition: { contains: search, mode: "insensitive" } },
      ],
    }),
  };
}

const anonymize = (c, unlockedIds, favoritedIds = new Set()) => {
  const isUnlocked = unlockedIds.has(c.id);
  const base = {
    id: c.id,
    reference: `Candidat #${c.id.slice(0, 8).toUpperCase()}`,
    headline: c.headline,
    category: c.category ? { name: c.category.name, slug: c.category.slug } : null,
    currentPosition: c.currentPosition,
    skills: c.skills,
    educationLevel: c.educationLevel,
    experienceLevel: c.experienceLevel,
    desiredContractTypes: c.desiredContractTypes,
    languages: c.languages,
    city: c.mobilityCity || c.user?.city || null,
    isAvailableForWork: c.isAvailableForWork,
    availableFrom: c.availableFrom,
    updatedAt: c.updatedAt,
    isUnlocked,
    isFavorited: favoritedIds.has(c.id),
  };
  if (isUnlocked) {
    base.name = c.user?.name;
    base.email = c.user?.email;
    base.phone = c.user?.phone;
    base.avatar = c.user?.avatar;
    base.cvUrl = c.cvUrl;
    base.portfolioUrl = c.portfolioUrl;
  }
  return base;
};

function anonymizeUnlocked(c) {
  return {
    id: c.id,
    isUnlocked: true,
    name: c.user?.name,
    email: c.user?.email,
    phone: c.user?.phone,
    avatar: c.user?.avatar,
    cvUrl: c.cvUrl,
    portfolioUrl: c.portfolioUrl,
    headline: c.headline,
    category: c.category ? { name: c.category.name, slug: c.category.slug } : null,
    currentPosition: c.currentPosition,
    skills: c.skills,
    educationLevel: c.educationLevel,
    experienceLevel: c.experienceLevel,
    desiredContractTypes: c.desiredContractTypes,
    languages: c.languages,
    city: c.mobilityCity || c.user?.city || null,
    isAvailableForWork: c.isAvailableForWork,
    availableFrom: c.availableFrom,
    updatedAt: c.updatedAt,
  };
}

// GET /api/headhunter/candidates
const getCandidates = async (req, res) => {
  try {
    const { page = 1, availableOnly } = req.query;
    const limit = clampLimit(req.query.limit);
    const skip = (parseInt(page) - 1) * limit;
    const businessUserId = req.user.userId;

    const where = {
      visibleToRecruiters: true,
      ...buildCandidateWhere(req.query),
      ...(availableOnly === "true" && { isAvailableForWork: true }),
    };

    const [candidates, total, unlocks, favorites] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { name: true, email: true, phone: true, avatar: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.candidateProfile.count({ where }),
      prisma.candidateUnlock.findMany({
        where: { businessUserId },
        select: { candidateProfileId: true },
      }),
      prisma.favorite.findMany({
        where: { userId: businessUserId, itemType: "CANDIDATE" },
        select: { itemId: true },
      }),
    ]);

    const unlockedIds = new Set(unlocks.map((u) => u.candidateProfileId));
    const favoritedIds = new Set(favorites.map((f) => f.itemId));

    res.json({
      success: true,
      data: candidates.map((c) => anonymize(c, unlockedIds, favoritedIds)),
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getCandidates error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/headhunter/filters-count
const getFiltersCount = async (req, res) => {
  try {
    const baseWhere = { visibleToRecruiters: true };
    const [educationCounts, experienceCounts, all] = await Promise.all([
      prisma.candidateProfile.groupBy({ by: ["educationLevel"], where: baseWhere, _count: { educationLevel: true } }),
      prisma.candidateProfile.groupBy({ by: ["experienceLevel"], where: baseWhere, _count: { experienceLevel: true } }),
      prisma.candidateProfile.findMany({ where: baseWhere, select: { desiredContractTypes: true } }),
    ]);

    const toMap = (arr, key) =>
      arr.reduce((acc, i) => { if (i[key]) acc[i[key]] = i._count[key]; return acc; }, {});

    const contractType = all.reduce((acc, c) => {
      (c.desiredContractTypes || []).forEach((t) => { acc[t] = (acc[t] || 0) + 1; });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        educationLevel: toMap(educationCounts, "educationLevel"),
        experienceLevel: toMap(experienceCounts, "experienceLevel"),
        contractType,
      },
    });
  } catch (error) {
    console.error("getFiltersCount (candidates) error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/headhunter/candidates/:id/unlock
const unlockCandidate = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { id: candidateProfileId } = req.params;

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true, city: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    if (!candidate || !candidate.visibleToRecruiters) {
      return res.status(404).json({ success: false, message: "Candidat introuvable" });
    }

    const existing = await prisma.candidateUnlock.findUnique({
      where: { businessUserId_candidateProfileId: { businessUserId, candidateProfileId } },
    });
    if (existing) {
      return res.json({
        success: true,
        alreadyUnlocked: true,
        data: { ...anonymizeUnlocked(candidate), notes: existing.notes, unlockedAt: existing.createdAt },
      });
    }

    const decrement = await prisma.user.updateMany({
      where: { id: businessUserId, creditBalance: { gte: 1 } },
      data: { creditBalance: { decrement: 1 } },
    });
    if (decrement.count === 0) {
      return res.status(402).json({ success: false, message: "Crédits insuffisants" });
    }

    try {
      await prisma.$transaction([
        prisma.creditTransaction.create({
          data: { userId: businessUserId, type: "UNLOCK", amount: -1 },
        }),
        prisma.candidateUnlock.create({
          data: { businessUserId, candidateProfileId },
        }),
      ]);
    } catch (err) {
      await prisma.user.update({
        where: { id: businessUserId },
        data: { creditBalance: { increment: 1 } },
      });
      throw err;
    }

    const updatedBalance = await prisma.user.findUnique({
      where: { id: businessUserId },
      select: { creditBalance: true },
    });

    await createNotification(
      candidate.userId,
      "PROFILE_VIEWED_BY_RECRUITER",
      "Un recruteur a consulté votre profil 👀",
      "Votre profil candidat a été consulté par une entreprise sur Madinatti. Gardez-le à jour pour multiplier vos chances.",
      "/my-space/profile"
    );

    res.json({
      success: true,
      alreadyUnlocked: false,
      balance: updatedBalance.creditBalance,
      data: { ...anonymizeUnlocked(candidate), notes: null, unlockedAt: new Date() },
    });
  } catch (error) {
    console.error("unlockCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/headhunter/unlocked — filtrable/triable, indépendant de visibleToRecruiters
const getUnlockedCandidates = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { page = 1, sort = "recent_unlock" } = req.query;
    const limit = clampLimit(req.query.limit);
    const skip = (parseInt(page) - 1) * limit;

    const where = {
      businessUserId,
      candidateProfile: buildCandidateWhere(req.query),
    };

    const orderBy = sort === "recent_profile"
      ? { candidateProfile: { updatedAt: "desc" } }
      : { createdAt: "desc" };

    const [unlocks, total] = await Promise.all([
      prisma.candidateUnlock.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          candidateProfile: {
            include: {
              user: { select: { name: true, email: true, phone: true, avatar: true, city: true } },
              category: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.candidateUnlock.count({ where }),
    ]);

    res.json({
      success: true,
      data: unlocks.map((u) => ({
        ...anonymizeUnlocked(u.candidateProfile),
        notes: u.notes,
        unlockedAt: u.createdAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getUnlockedCandidates error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// PATCH /api/headhunter/candidates/:id/notes
const updateUnlockNotes = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { id: candidateProfileId } = req.params;
    const { notes } = req.body;

    const existing = await prisma.candidateUnlock.findUnique({
      where: { businessUserId_candidateProfileId: { businessUserId, candidateProfileId } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Ce candidat n'est pas dans vos débloqués" });
    }

    const updated = await prisma.candidateUnlock.update({
      where: { id: existing.id },
      data: { notes: notes?.trim() ? notes.trim().slice(0, 1000) : null },
    });

    res.json({ success: true, notes: updated.notes });
  } catch (error) {
    console.error("updateUnlockNotes error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/headhunter/unlocked/export — CSV simple
const exportUnlockedCsv = async (req, res) => {
  try {
    const businessUserId = req.user.userId;

    const unlocks = await prisma.candidateUnlock.findMany({
      where: { businessUserId },
      orderBy: { createdAt: "desc" },
      include: {
        candidateProfile: {
          include: {
            user: { select: { name: true, email: true, phone: true, city: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = ["Nom", "Email", "Téléphone", "Métier", "Poste actuel", "Compétences", "Résumé", "Diplôme", "Expérience", "Ville", "Disponible", "Notes", "Débloqué le"];
    const lines = [headerRow.map(escapeCsv).join(",")];

    unlocks.forEach((u) => {
      const c = u.candidateProfile;
      lines.push([
        c.user?.name,
        c.user?.email,
        c.user?.phone,
        c.category?.name,
        c.currentPosition,
        Array.isArray(c.skills) ? c.skills.join("; ") : "",
        c.headline,
        c.educationLevel,
        c.experienceLevel,
        c.mobilityCity || c.user?.city,
        c.isAvailableForWork ? "Oui" : "Non",
        u.notes,
        new Date(u.createdAt).toLocaleDateString("fr-FR"),
      ].map(escapeCsv).join(","));
    });

    const csv = "\uFEFF" + lines.join("\r\n"); // BOM pour un bon affichage des accents dans Excel

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="candidats_debloques.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("exportUnlockedCsv error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/headhunter/candidates/:id/favorite — toggle, gratuit
const toggleFavoriteCandidate = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { id: candidateProfileId } = req.params;

    const candidate = await prisma.candidateProfile.findUnique({ where: { id: candidateProfileId } });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidat introuvable" });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_itemId_itemType: { userId: businessUserId, itemId: candidateProfileId, itemType: "CANDIDATE" },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ success: true, favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: businessUserId, itemId: candidateProfileId, itemType: "CANDIDATE" },
    });
    res.json({ success: true, favorited: true });
  } catch (error) {
    console.error("toggleFavoriteCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/headhunter/favorites — candidats mis en favori, anonymisés sauf si déjà débloqués
const getFavoriteCandidates = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { page = 1 } = req.query;
    const limit = clampLimit(req.query.limit);
    const skip = (parseInt(page) - 1) * limit;

    const [favorites, totalFavorites] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: businessUserId, itemType: "CANDIDATE" },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.favorite.count({ where: { userId: businessUserId, itemType: "CANDIDATE" } }),
    ]);

    const candidateIds = favorites.map((f) => f.itemId);

    const [candidates, unlocks] = await Promise.all([
      prisma.candidateProfile.findMany({
        where: { id: { in: candidateIds } },
        include: {
          user: { select: { name: true, email: true, phone: true, avatar: true, city: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.candidateUnlock.findMany({
        where: { businessUserId, candidateProfileId: { in: candidateIds } },
        select: { candidateProfileId: true },
      }),
    ]);

    const unlockedIds = new Set(unlocks.map((u) => u.candidateProfileId));
    const allFavoritedIds = new Set(candidateIds);
    // Préserve l'ordre "plus récemment favori d'abord"
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const ordered = candidateIds.map((id) => byId.get(id)).filter(Boolean);

    res.json({
      success: true,
      data: ordered.map((c) => anonymize(c, unlockedIds, allFavoritedIds)),
      pagination: {
        total: totalFavorites,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(totalFavorites / limit),
      },
    });
  } catch (error) {
    console.error("getFavoriteCandidates error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = {
  getCandidates,
  getFiltersCount,
  unlockCandidate,
  getUnlockedCandidates,
  updateUnlockNotes,
  exportUnlockedCsv,
  toggleFavoriteCandidate,
  getFavoriteCandidates,
};