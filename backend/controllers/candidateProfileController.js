const prisma = require("../config/db");
const { cloudinary } = require("../config/cloudinary");
const { createNotification } = require("./notificationController");

const REQUIRED_FIELDS = ["educationLevel", "experienceLevel"];

const isComplete = (p) =>
  !!p &&
  REQUIRED_FIELDS.every((f) => p[f]) &&
  Array.isArray(p.desiredContractTypes) &&
  p.desiredContractTypes.length > 0 &&
  !!p.cvUrl;

const getMyCandidateProfile = async (req, res) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: req.user.userId },
      include: { category: { select: { name: true, slug: true } } },
    });
    res.json({ success: true, data: profile, complete: isComplete(profile) });
  } catch (error) {
    console.error("getMyCandidateProfile error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

const upsertMyCandidateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      headline,
      categorySlug,
      currentPosition,
      skills,
      portfolioUrl,
      isAvailableForWork,
      availableFrom,
      educationLevel,
      experienceLevel,
      desiredContractTypes,
      languages,
      mobilityRegion,
      mobilityCity,
      visibleToRecruiters,
    } = req.body;

    if (portfolioUrl && !/^https?:\/\/.+\..+/.test(portfolioUrl)) {
      return res.status(400).json({ success: false, message: "Lien portfolio invalide. Ex : https://monportfolio.com" });
    }

    let categoryId = null;
    if (categorySlug) {
      const category = await prisma.category.findFirst({ where: { slug: categorySlug, module: "emploi" } });
      if (!category) {
        return res.status(400).json({ success: false, message: "Métier introuvable" });
      }
      categoryId = category.id;
    }

    const data = {
      headline: headline?.trim() ? headline.trim().slice(0, 150) : null,
      categoryId,
      currentPosition: currentPosition?.trim() ? currentPosition.trim().slice(0, 100) : null,
      skills: (skills ? (typeof skills === "string" ? JSON.parse(skills) : skills) : [])
        .filter((s) => typeof s === "string" && s.trim())
        .map((s) => s.trim().slice(0, 40))
        .slice(0, 15),      portfolioUrl: portfolioUrl?.trim() || null,
      isAvailableForWork: isAvailableForWork === "false" ? false : !!isAvailableForWork,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      educationLevel: educationLevel || null,
      experienceLevel: experienceLevel || null,
      desiredContractTypes: Array.isArray(desiredContractTypes)
        ? desiredContractTypes
        : desiredContractTypes
        ? JSON.parse(desiredContractTypes)
        : [],
      languages: languages ? (typeof languages === "string" ? JSON.parse(languages) : languages) : [],
      mobilityRegion: mobilityRegion || null,
      mobilityCity: mobilityCity || null,
      visibleToRecruiters: false, // recalculé juste en dessous, jamais fait confiance au client
    };

    // Récupéré une seule fois : sert au check CV ET à détecter la transition
    // "devient visible" pour ne notifier les alertes qu'une fois, pas à chaque save.
    const existingProfile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const wasVisible = existingProfile?.visibleToRecruiters || false;

    const wantsVisible = visibleToRecruiters === "true" || visibleToRecruiters === true;
    if (wantsVisible) {
      const willHaveCv = !!req.file || !!existingProfile?.cvUrl;
      const complete = isComplete({ ...data, cvUrl: willHaveCv ? "x" : null });
      if (!complete) {
        return res.status(400).json({
          success: false,
          message: "Profil incomplet : diplôme, expérience, type de contrat et CV sont requis pour être visible par les recruteurs.",
        });
      }
      data.visibleToRecruiters = true;
    }

    if (req.file) {
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ success: false, message: "Le CV doit être un fichier PDF" });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: "Le CV ne doit pas dépasser 5 Mo" });
      }
      const cvUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "candidate-cv", resource_type: "raw", public_id: `cv_${userId}_${Date.now()}.pdf`, type: "authenticated" },
          (error, result) => (error ? reject(error) : resolve(result.secure_url))
        );
        stream.end(req.file.buffer);
      });
      data.cvUrl = cvUrl;
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
      include: { category: { select: { name: true, slug: true } } },
    });

    // Nouvelle visibilité (pas juste une mise à jour d'un profil déjà visible)
    // → notifier les recruteurs dont une alerte Headhunter correspond.
    if (data.visibleToRecruiters && !wasVisible) {
      await notifyHeadhunterAlertSubscribers(profile);
    }

    res.json({ success: true, data: profile, complete: isComplete(profile) });
  } catch (error) {
    console.error("upsertMyCandidateProfile error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// Réutilise le même modèle Alert que emploi/immobilier/automobile, module="headhunter".
// Filtres stockés : { educationLevel, experienceLevel, contractType, city, region, search }
async function notifyHeadhunterAlertSubscribers(profile) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: "headhunter", isActive: true },
    });
    if (alerts.length === 0) return;

    const user = await prisma.user.findUnique({ where: { id: profile.userId }, select: { city: true } });
    const profileCity = profile.mobilityCity || user?.city || null;
    const profileCategory = profile.categoryId
      ? await prisma.category.findUnique({ where: { id: profile.categoryId }, select: { slug: true } })
      : null;

    // Le mot-clé d'une alerte peut correspondre au résumé, au poste actuel,
    // ou à l'une des compétences — pas seulement au headline, sinon un
    // recruteur cherchant "React" rate les candidats qui n'ont mis "React"
    // que dans leurs tags de compétences.
    const searchableText = [
      profile.headline,
      profile.currentPosition,
      ...(Array.isArray(profile.skills) ? profile.skills : []),
    ].filter(Boolean).join(" ").toLowerCase();

    for (const alert of alerts) {
      const f = alert.filters || {};
      const matches =
        (!f.educationLevel || f.educationLevel === profile.educationLevel) &&
        (!f.experienceLevel || f.experienceLevel === profile.experienceLevel) &&
        (!f.contractType || (profile.desiredContractTypes || []).includes(f.contractType)) &&
        (!f.categorySlug || f.categorySlug === profileCategory?.slug) &&
        (!f.city || (profileCity || "").toLowerCase().includes(f.city.toLowerCase())) &&
        (!f.search || searchableText.includes(f.search.toLowerCase()));

      if (matches) {
        await prisma.alertMatch.create({
          data: {
            alertId: alert.id,
            targetTitle: profile.headline || "Nouveau candidat",
            targetLink: "/dashboard/headhunter",
          },
        });
      }
    }
  } catch (err) {
    console.error("[notifyHeadhunterAlertSubscribers] error:", err);
  }
}

module.exports = { getMyCandidateProfile, upsertMyCandidateProfile };