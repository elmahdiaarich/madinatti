const prisma = require("../config/db");
const { cities: moroccoCities } = require("morocco-cities");
const { createNotification } = require("./notificationController");

const citiesByRegion = moroccoCities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// Anonymise un profil — sauf si déjà débloqué par ce recruteur (unlockedIds)
const anonymize = (c, unlockedIds) => {
  const isUnlocked = unlockedIds.has(c.id);
  const base = {
    id: c.id,
    reference: `Candidat #${c.id.slice(0, 8).toUpperCase()}`,
    headline: c.headline,
    educationLevel: c.educationLevel,
    experienceLevel: c.experienceLevel,
    desiredContractTypes: c.desiredContractTypes,
    languages: c.languages,
    desiredSalaryMin: c.desiredSalaryMin,
    desiredSalaryMax: c.desiredSalaryMax,
    city: c.mobilityCity || c.user?.city || null,
    isAvailableForWork: c.isAvailableForWork,
    availableFrom: c.availableFrom,
    updatedAt: c.updatedAt,
    isUnlocked,
  };
  if (isUnlocked) {
    base.name = c.user?.name;
    base.email = c.user?.email;
    base.phone = c.user?.phone;
    base.avatar = c.user?.avatar;
    base.cvUrl = c.cvUrl;
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
    headline: c.headline,
    educationLevel: c.educationLevel,
    experienceLevel: c.experienceLevel,
    desiredContractTypes: c.desiredContractTypes,
    languages: c.languages,
    desiredSalaryMin: c.desiredSalaryMin,
    desiredSalaryMax: c.desiredSalaryMax,
    city: c.mobilityCity || c.user?.city || null,
    isAvailableForWork: c.isAvailableForWork,
    availableFrom: c.availableFrom,
  };
}

// GET /api/headhunter/candidates
const getCandidates = async (req, res) => {
  try {
    const {
      page = 1, limit = 10,
      educationLevel, experienceLevel, contractType,
      city, region, availableOnly, search,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const businessUserId = req.user.userId;

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

    const where = {
      visibleToRecruiters: true,
      ...locationFilter,
      ...(educationLevel && { educationLevel }),
      ...(experienceLevel && { experienceLevel }),
      ...(contractType && { desiredContractTypes: { has: contractType } }),
      ...(availableOnly === "true" && { isAvailableForWork: true }),
      ...(search && { headline: { contains: search, mode: "insensitive" } }),
    };

    const [candidates, total, unlocks] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { updatedAt: "desc" },
        include: { user: { select: { name: true, email: true, phone: true, avatar: true, city: true } } },
      }),
      prisma.candidateProfile.count({ where }),
      prisma.candidateUnlock.findMany({
        where: { businessUserId },
        select: { candidateProfileId: true },
      }),
    ]);

    const unlockedIds = new Set(unlocks.map((u) => u.candidateProfileId));

    res.json({
      success: true,
      data: candidates.map((c) => anonymize(c, unlockedIds)),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
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
      include: { user: { select: { name: true, email: true, phone: true, avatar: true, city: true } } },
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
        data: anonymizeUnlocked(candidate),
      });
    }

    // Décrément atomique et conditionnel : évite qu'un double-clic ou deux
    // onglets fassent passer deux requêtes le check de solde en même temps
    // et fassent chuter le solde en négatif.
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
      // Rollback manuel du crédit si la trace ou le unlock échoue
      // (ex: double-clic concurrent créant un CandidateUnlock en double —
      // @@unique bloque la 2e création, on rend le crédit consommé pour rien).
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

    // Notifie le candidat sans révéler l'identité du recruteur — juste un signal
    // qu'un profil génère de l'intérêt, pour valoriser la fonctionnalité côté candidat.
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
      data: anonymizeUnlocked(candidate),
    });
  } catch (error) {
    console.error("unlockCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/headhunter/unlocked
// Liste des candidats débloqués par ce recruteur — indépendant de
// visibleToRecruiters, pour ne jamais perdre l'accès à un profil déjà payé.
const getUnlockedCandidates = async (req, res) => {
  try {
    const businessUserId = req.user.userId;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [unlocks, total] = await Promise.all([
      prisma.candidateUnlock.findMany({
        where: { businessUserId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          candidateProfile: {
            include: { user: { select: { name: true, email: true, phone: true, avatar: true, city: true } } },
          },
        },
      }),
      prisma.candidateUnlock.count({ where: { businessUserId } }),
    ]);

    res.json({
      success: true,
      data: unlocks.map((u) => ({
        ...anonymizeUnlocked(u.candidateProfile),
        unlockedAt: u.createdAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getUnlockedCandidates error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = { getCandidates, getFiltersCount, unlockCandidate, getUnlockedCandidates };