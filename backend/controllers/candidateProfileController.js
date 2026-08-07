const prisma = require("../config/db");
const { cloudinary } = require("../config/cloudinary");

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
      isAvailableForWork,
      availableFrom,
      educationLevel,
      experienceLevel,
      desiredContractTypes,
      languages,
      desiredSalaryMin,
      desiredSalaryMax,
      mobilityRegion,
      mobilityCity,
      visibleToRecruiters,
    } = req.body;

    if (desiredSalaryMin && desiredSalaryMax && Number(desiredSalaryMin) > Number(desiredSalaryMax)) {
      return res.status(400).json({ success: false, message: "Le salaire minimum ne peut pas dépasser le maximum." });
    }

    const data = {
      headline: headline?.trim() ? headline.trim().slice(0, 150) : null,
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
      desiredSalaryMin: desiredSalaryMin ? Number(desiredSalaryMin) : null,
      desiredSalaryMax: desiredSalaryMax ? Number(desiredSalaryMax) : null,
      mobilityRegion: mobilityRegion || null,
      mobilityCity: mobilityCity || null,
      visibleToRecruiters: false, // recalculé juste en dessous, jamais fait confiance au client
    };

    const wantsVisible = visibleToRecruiters === "true" || visibleToRecruiters === true;
    if (wantsVisible) {
      // Le CV existant (déjà en base, avant cet upsert) compte aussi —
      // sinon un candidat qui a déjà uploadé son CV serait bloqué à chaque
      // modification ultérieure du profil qui n'inclut pas de nouveau fichier.
      const existing = await prisma.candidateProfile.findUnique({ where: { userId } });
      const willHaveCv = !!req.file || !!existing?.cvUrl;
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
          { folder: "candidate-cv", resource_type: "auto", public_id: `cv_${userId}_${Date.now()}`, access_mode: "public" },
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
    });

    res.json({ success: true, data: profile, complete: isComplete(profile) });
  } catch (error) {
    console.error("upsertMyCandidateProfile error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = { getMyCandidateProfile, upsertMyCandidateProfile };