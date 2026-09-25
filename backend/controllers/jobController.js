const prisma = require("../config/db");
const { cloudinary } = require("../config/cloudinary");
const { cities: moroccoCities } = require('morocco-cities');
const { trackListingView } = require("../services/viewTrackingService");
const { prepareListingOwnership } = require("../services/shopService");

// Build once at module load — same pattern as real estate
const citiesByRegion = moroccoCities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs
// ─────────────────────────────────────────────────────────────────────────────

const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      categoryId,
      contractType,
      city,
      region,
      educationLevel,
      experienceLevel,
      categorySlug,
      salarySpecified,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ── Location filter ──────────────────────────────────────────────
    let locationFilter = {};
    if (city) {
      locationFilter = { city: { contains: city, mode: 'insensitive' } };
    } else if (region) {
      // Match directly on the stored `region` field (primary), OR fall back
      // to expanding the region into its constituent cities for older listings
      // that may not have the region field populated.
      const citiesInRegion = citiesByRegion[region] || [];
      locationFilter = {
        OR: [
          { region: { contains: region, mode: 'insensitive' } },
          ...(citiesInRegion.length > 0
            ? [{ city: { in: citiesInRegion } }]
            : []),
        ],
      };
    }
    // ────────────────────────────────────────────────────────────────

    const where = {
      status: 'APPROVED',
      // Wrap location OR and search OR in AND so they don't overwrite each other
      AND: [
        ...(Object.keys(locationFilter).length > 0 ? [locationFilter] : []),
        ...(search
          ? [{
              OR: [
                { title:       { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }]
          : []),
      ],
      ...(categoryId     && { categoryId }),
      ...(contractType   && { contractType }),
      ...(educationLevel && { educationLevel: { hasSome: educationLevel.split(',') } }),
      ...(experienceLevel && { experienceLevel }),
      ...(categorySlug   && { category: { slug: categorySlug } }),
      ...(salarySpecified === 'true' && {
        NOT: { AND: [{ salaryMin: null }, { salaryMax: null }] },
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        select: {
          id: true,
          title: true,
          companyName: true,
          city: true,
          location: true,
          region: true,
          contractType: true,
          educationLevel: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          salaryPeriod: true,
          isFeatured: true,
          isSponsored: true,
          publishedAt: true,
          applicationDeadline: true,
          skills: true,
          category: { select: { id: true, name: true } },
          user: { select: { companyLogo: true } },
          sellerType: true,
          shop: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, status: true } },
        },
      }),
      prisma.jobListing.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getJobs error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/:id
// ─────────────────────────────────────────────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.jobListing.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            companyWebsite: true,
            companyLogo: true,
            city: true,
          },
        },
        _count: { select: { applications: true } },
        shop: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, status: true, professionalPhone: true } },
      },
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    }
    if (job.status !== "APPROVED") {
      return res
        .status(403)
        .json({ success: false, message: "Offre non disponible" });
    }

    await trackListingView(job.id, "JOB", req.user?.userId || null);

    res.json({ success: true, data: job });
  } catch (error) {
    console.error("getJobById error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/filters-count
// ─────────────────────────────────────────────────────────────────────────────
const getFiltersCount = async (req, res) => {
  try {
    const baseWhere = { status: "APPROVED" };

    const [
      contractCounts,
      experienceCounts,
      educationCounts,
      cityCounts,
      regionCounts,
      categoryCounts,
      regionCityRaw,
    ] = await Promise.all([
      prisma.jobListing.groupBy({
        by: ["contractType"],
        where: baseWhere,
        _count: { contractType: true },
      }),
      prisma.jobListing.groupBy({
        by: ["experienceLevel"],
        where: baseWhere,
        _count: { experienceLevel: true },
      }),
      prisma.jobListing.findMany({
        where: baseWhere,
        select: { educationLevel: true },
      }),
      prisma.jobListing.groupBy({
        by: ["city"],
        where: baseWhere,
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 50,
      }),
      prisma.jobListing.groupBy({
        by: ["region"],
        where: { ...baseWhere, region: { not: null } },
        _count: { region: true },
        orderBy: { _count: { region: "desc" } },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          jobListings: { some: { status: "APPROVED" } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { jobListings: { where: { status: "APPROVED" } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      // Villes groupées par région
      prisma.jobListing.findMany({
        where: {
          status: "APPROVED",
          region: { not: null },
        },
        select: { region: true, city: true, location: true },
      }),
    ]);

    const toMap = (arr, key, countKey) =>
      arr.reduce((acc, item) => {
        if (item[key]) acc[item[key]] = item._count[countKey];
        return acc;
      }, {});

    // Construire citiesByRegion : { "Grand Casablanca": { "Casablanca": 12, ... }, ... }
    const citiesByRegion = regionCityRaw.reduce((acc, { region, city }) => {
      if (!region || !city) return acc;
      if (!acc[region]) acc[region] = {};
      acc[region][city] = (acc[region][city] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        contractType: toMap(contractCounts, "contractType", "contractType"),
        experienceLevel: toMap(
          experienceCounts,
          "experienceLevel",
          "experienceLevel",
        ),
        educationLevel: educationCounts.reduce((acc, job) => {
          (job.educationLevel || []).forEach((lvl) => {
            acc[lvl] = (acc[lvl] || 0) + 1;
          });
          return acc;
        }, {}),
        city: toMap(cityCounts, "city", "city"),
        region: toMap(regionCounts, "region", "region"),
        citiesByRegion,
        categories: categoryCounts.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.jobListings,
        })),
      },
    });
  } catch (error) {
    console.error("getFiltersCount error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jobs  — business only
// ─────────────────────────────────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      title,
      categorySlug,
      city,
      location,
      region,
      remote,
      contractType,
      salaryMin,
      salaryMax,
      applicationDeadline,
      educationLevel,
      experienceLevel,
      skills,
      languages,
      description,
    } = req.body;

    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Le titre est requis" });
    if (!contractType)
      return res
        .status(400)
        .json({ success: false, message: "Le type de contrat est requis" });
    if (!categorySlug)
      return res
        .status(400)
        .json({ success: false, message: "La catégorie est requise" });
    if (!city)
      return res
        .status(400)
        .json({ success: false, message: "La ville est requise" });
    if (!description?.trim())
      return res
        .status(400)
        .json({ success: false, message: "La description est requise" });

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: "Catégorie introuvable" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyName: true },
    });
    const listingOwner = await prepareListingOwnership(req.body.shopId, userId);

    const job = await prisma.jobListing.create({
      data: {
        userId,
        ...listingOwner,
        categoryId: category.id,
        title: title.trim(),
        description: description.trim(),
        companyName: user?.companyName || "",
        city,
        location: location || "",
        region: region || null,
        remote: remote || "ON_SITE",
        contractType,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryPeriod: salaryMin || salaryMax ? "MONTHLY" : null,
        applicationDeadline: applicationDeadline
          ? new Date(applicationDeadline)
          : null,
        educationLevel: Array.isArray(educationLevel) ? educationLevel : [],
        experienceLevel: experienceLevel || null,
        skills: Array.isArray(skills) ? skills : [],
        languages: Array.isArray(languages) ? languages : [],
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Offre soumise avec succès, en attente de validation",
      data: { id: job.id },
    });
  } catch (error) {
    console.error("createJob error:", error);
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jobs/:id/apply  — citoyen only
// ─────────────────────────────────────────────────────────────────────────────
const applyToJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: jobId } = req.params;
    const { coverLetter, phone } = req.body;

    // 1. Vérifier que l'offre existe et est APPROVED
    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    if (job.status !== "APPROVED")
      return res
        .status(400)
        .json({ success: false, message: "Cette offre n'est plus disponible" });

    // 2. Empêcher l'employeur de postuler à sa propre offre
    if (job.userId === userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Vous ne pouvez pas postuler à votre propre offre",
        });
    }

    // 3. Vérifier qu'il n'a pas déjà postulé (double sécurité en plus du @@unique)
    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobListingId: { userId, jobListingId: jobId } },
    });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Vous avez déjà postulé à cette offre",
        });
    }

    // 4. Vérifier que le fichier CV est présent
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Le CV est obligatoire" });
    }

    // 5. Valider le fichier (PDF, max 5 Mo)
    if (req.file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ success: false, message: "Le CV doit être un fichier PDF" });
    }
    if (req.file.size > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ success: false, message: "Le CV ne doit pas dépasser 5 Mo" });
    }

    // 6. Upload CV vers Cloudinary (dossier cv/)
    const cvUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "cv",
          resource_type: "auto",
          public_id: `cv_${userId}_${jobId}_${Date.now()}`,
          access_mode: "public",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );
      stream.end(req.file.buffer);
    });

    // 7. Sauvegarder la candidature en DB
    const application = await prisma.jobApplication.create({
      data: {
        jobListingId: jobId,
        userId,
        cvPath: cvUrl,
        coverLetter: coverLetter?.trim() || null,
        status: "pending", // pending → viewed → accepted
      },
    });

    // 8. Mettre à jour le téléphone du candidat si renseigné et différent
    if (phone?.trim()) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: phone.trim() },
      });
    }
    // Notify business of new application
    const { createNotification } = require("./notificationController");
    await createNotification(
      job.userId,
      "NEW_APPLICATION",
      "Nouvelle candidature reçue",
      `Un candidat a postulé pour "${job.title}".`,
      "/dashboard/applications",
    );
    res.status(201).json({
      success: true,
      message: "Candidature envoyée avec succès",
      data: { id: application.id },
    });
  } catch (error) {
    // Contrainte unique Prisma
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          success: false,
          message: "Vous avez déjà postulé à cette offre",
        });
    }
    console.error("applyToJob error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/:id/applications  — business: voir les candidatures de son offre
// ─────────────────────────────────────────────────────────────────────────────
const getJobApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: jobId } = req.params;

    // Vérifier que l'offre appartient à ce business
    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    if (job.userId !== userId)
      return res.status(403).json({ success: false, message: "Accès refusé" });

    const applications = await prisma.jobApplication.findMany({
      where: { jobListingId: jobId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            city: true,
          },
        },
      },
    });

    // Marquer les candidatures "pending" comme "viewed"
    await prisma.jobApplication.updateMany({
      where: { jobListingId: jobId, status: "pending" },
      data: { status: "viewed" },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error("getJobApplications error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/jobs/applications/:appId/status  — business: accepter une candidature
// Statuts possibles : viewed | accepted  (pas de rejected visible côté candidat)
// ─────────────────────────────────────────────────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appId } = req.params;
    const { status } = req.body;

    const ALLOWED = ["viewed", "accepted"];
    if (!ALLOWED.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Statut invalide" });
    }

    // Vérifier que la candidature appartient à une offre de ce business
    const application = await prisma.jobApplication.findUnique({
      where: { id: appId },
      include: { jobListing: { select: { userId: true } } },
    });
    if (!application)
      return res
        .status(404)
        .json({ success: false, message: "Candidature introuvable" });
    if (application.jobListing.userId !== userId)
      return res.status(403).json({ success: false, message: "Accès refusé" });

    const updated = await prisma.jobApplication.update({
      where: { id: appId },
      data: { status, reviewedAt: new Date() },
      include: { jobListing: { select: { title: true, id: true } } },
    });

    // Notify citizen only if accepted
    if (status === "accepted") {
      const { createNotification } = require("./notificationController");
      await createNotification(
        application.userId,
        "APPLICATION_ACCEPTED",
        "Candidature acceptée ! 🎉",
        `Votre candidature pour "${updated.jobListing.title}" a été acceptée.`,
        `/jobs/${updated.jobListing.id}`,
      );
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("updateApplicationStatus error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/applications/my  — citoyen: voir ses propres candidatures
// ─────────────────────────────────────────────────────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        jobListing: {
          select: {
            id: true,
            title: true,
            companyName: true,
            city: true,
            location: true,
            status: true,
            user: { select: { companyLogo: true } },
          },
        },
      },
    });

    // Le candidat voit seulement "pending/viewed" → "En cours"  |  "accepted" → "Retenu"
    // On ne renvoie PAS de statut "rejected"
    const mapped = applications.map((app) => ({
      id: app.id,
      createdAt: app.createdAt,
      cvPath: app.cvPath,
      coverLetter: app.coverLetter,
      status: app.status === "accepted" ? "accepted" : "pending", // simplifié pour le candidat
      job: app.jobListing,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error("getMyApplications error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jobs/:id/favorite  — toggle favori
// ─────────────────────────────────────────────────────────────────────────────
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const job = await prisma.jobListing.findUnique({ where: { id } });
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_itemId_itemType: { userId, itemId: id, itemType: "JOB" },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ success: true, favorited: false });
    }

    await prisma.favorite.create({
      data: { userId, itemId: id, itemType: "JOB" },
    });
    res.json({ success: true, favorited: true });
  } catch (error) {
    console.error("toggleFavorite error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/favorites/me
// ─────────────────────────────────────────────────────────────────────────────
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favorites = await prisma.favorite.findMany({
      where: { userId, itemType: "JOB" },
      orderBy: { createdAt: "desc" },
    });

    const jobIds = favorites.map((f) => f.itemId);
    const jobs = await prisma.jobListing.findMany({
      where: { id: { in: jobIds }, status: "APPROVED" },
      select: {
        id: true,
        title: true,
        companyName: true,
        city: true,
        location: true,
        contractType: true,
        educationLevel: true,
        experienceLevel: true,
        salaryMin: true,
        salaryMax: true,
        isFeatured: true,
        publishedAt: true,
        applicationDeadline: true,
        category: { select: { id: true, name: true } },
        user: { select: { companyLogo: true } },
      },
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error("getMyFavorites error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/categories
// ─────────────────────────────────────────────────────────────────────────────
const getJobCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { module: "emploi", isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("getJobCategories error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/my  — business: list own job postings
// ─────────────────────────────────────────────────────────────────────────────
const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, search, contractType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId,
      ...(status && { status }),
      ...(contractType && { contractType }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { applications: true } },
          user: { select: { companyLogo: true } }, // ← ADD THIS
        },
      }),
      prisma.jobListing.count({ where }),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getMyJobs error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/jobs/:id  — owner only, resets to PENDING
// ─────────────────────────────────────────────────────────────────────────────
const updateJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    if (existing.userId !== userId)
      return res.status(403).json({ success: false, message: "Accès refusé" });

    const {
      title,
      categorySlug,
      city,
      location,
      region,
      remote,
      contractType,
      salaryMin,
      salaryMax,
      applicationDeadline,
      educationLevel,
      experienceLevel,
      skills,
      languages,
      description,
    } = req.body;

    let categoryId = existing.categoryId;
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (!category)
        return res
          .status(400)
          .json({ success: false, message: "Catégorie introuvable" });
      categoryId = category.id;
    }

    const updated = await prisma.jobListing.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(categoryId && { categoryId }),
        ...(city && { city }),
        ...(location !== undefined && { location: location || "" }),
        ...(region !== undefined && { region: region || null }),
        ...(remote && { remote }),
        ...(contractType && { contractType }),
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryPeriod: salaryMin || salaryMax ? "MONTHLY" : null,
        applicationDeadline: applicationDeadline
          ? new Date(applicationDeadline)
          : null,
        ...(educationLevel && {
          educationLevel: Array.isArray(educationLevel) ? educationLevel : [],
        }),
        ...(experienceLevel !== undefined && {
          experienceLevel: experienceLevel || null,
        }),
        ...(skills && { skills: Array.isArray(skills) ? skills : [] }),
        ...(languages && {
          languages: Array.isArray(languages) ? languages : [],
        }),
        status: "PENDING",
        reviewedAt: null,
        reviewedBy: null,
        publishedAt: null,
        adminNotes: null,
      },
    });

    res.json({
      success: true,
      message: "Offre mise à jour, en attente de validation",
      data: updated,
    });
  } catch (error) {
    console.error("updateJob error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/jobs/:id  — owner only
// ─────────────────────────────────────────────────────────────────────────────
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Offre introuvable" });
    if (existing.userId !== userId)
      return res.status(403).json({ success: false, message: "Accès refusé" });

    await prisma.jobApplication.deleteMany({ where: { jobListingId: id } });
    await prisma.jobListing.delete({ where: { id } });

    res.json({ success: true, message: "Offre supprimée" });
  } catch (error) {
    console.error("deleteJob error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
const getBusinessApplications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const applications = await prisma.jobApplication.findMany({
      where: {
        jobListing: { userId },
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        jobListing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error("getBusinessApplications error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
module.exports = {
  getJobs,
  getJobById,
  getFiltersCount,
  getJobCategories,
  createJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  toggleFavorite,
  getMyFavorites,
  getMyJobs,
  updateJob,
  deleteJob,
  getBusinessApplications,
};
