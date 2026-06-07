const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs
// ─────────────────────────────────────────────────────────────────────────────
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId,
      contractType,
      location,
      educationLevel,
      experienceLevel,
      categorySlug,
      salarySpecified,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'PUBLISHED',
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId     && { categoryId }),
      ...(contractType   && { contractType }),
      ...(educationLevel && { educationLevel }),
      ...(experienceLevel && { experienceLevel }),
      ...(categorySlug   && { category: { slug: categorySlug } }),
      ...(location       && { location: { contains: location, mode: 'insensitive' } }),
      ...(salarySpecified === 'true' && {
        NOT: { AND: [{ salaryMin: null }, { salaryMax: null }] },
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
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
          category: { select: { id: true, name: true } },
          user:     { select: { companyLogo: true } },
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
    console.error('getJobs error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Offre introuvable' });
    }
    if (job.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, message: 'Offre non disponible' });
    }

    await prisma.jobListing.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('getJobById error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/filters-count
// ─────────────────────────────────────────────────────────────────────────────
const getFiltersCount = async (req, res) => {
  try {
    const baseWhere = { status: 'PUBLISHED' };

    const [contractCounts, experienceCounts, educationCounts, locationCounts, categoryCounts] =
      await Promise.all([
        prisma.jobListing.groupBy({
          by: ['contractType'],
          where: baseWhere,
          _count: { contractType: true },
        }),
        prisma.jobListing.groupBy({
          by: ['experienceLevel'],
          where: baseWhere,
          _count: { experienceLevel: true },
        }),
        prisma.jobListing.groupBy({
          by: ['educationLevel'],
          where: baseWhere,
          _count: { educationLevel: true },
        }),
        prisma.jobListing.groupBy({
          by: ['location'],
          where: baseWhere,
          _count: { location: true },
          orderBy: { _count: { location: 'desc' } },
          take: 20,
        }),
        prisma.category.findMany({
          where: {
            isActive: true,
            jobListings: { some: { status: 'PUBLISHED' } },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: { jobListings: { where: { status: 'PUBLISHED' } } },
            },
          },
          orderBy: { name: 'asc' },
        }),
      ]);

    const toMap = (arr, key, countKey) =>
      arr.reduce((acc, item) => {
        if (item[key]) acc[item[key]] = item._count[countKey];
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        contractType:    toMap(contractCounts,   'contractType',   'contractType'),
        experienceLevel: toMap(experienceCounts, 'experienceLevel','experienceLevel'),
        educationLevel:  toMap(educationCounts,  'educationLevel', 'educationLevel'),
        location:        toMap(locationCounts,   'location',       'location'),
        categories:      categoryCounts.map((c) => ({
          id:    c.id,
          name:  c.name,
          slug:  c.slug,
          count: c._count.jobListings,
        })),
      },
    });
  } catch (error) {
    console.error('getFiltersCount error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jobs  — business only
// ─────────────────────────────────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const userId = req.user.id; // injecté par authMiddleware

    const {
      title,
      categorySlug,
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

    // ── Validation minimale ────────────────────────────────
    if (!title?.trim())       return res.status(400).json({ success: false, message: 'Le titre est requis' });
    if (!contractType)        return res.status(400).json({ success: false, message: 'Le type de contrat est requis' });
    if (!categorySlug)        return res.status(400).json({ success: false, message: 'La catégorie est requise' });
    if (!location)            return res.status(400).json({ success: false, message: 'La ville est requise' });
    if (!description?.trim()) return res.status(400).json({ success: false, message: 'La description est requise' });

    // ── Résoudre categoryId depuis le slug ─────────────────
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(400).json({ success: false, message: 'Catégorie introuvable' });

    // ── Récupérer le companyName de l'user ─────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyName: true },
    });

    const job = await prisma.jobListing.create({
      data: {
        userId,
        categoryId:          category.id,
        title:               title.trim(),
        description:         description.trim(),
        companyName:         user?.companyName || '',
        location,
        region:              region || null,
        remote:              remote || 'ON_SITE',
        contractType,
        salaryMin:           salaryMin   ? Number(salaryMin)   : null,
        salaryMax:           salaryMax   ? Number(salaryMax)   : null,
        salaryPeriod:        salaryMin || salaryMax ? 'MONTHLY' : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        educationLevel:      educationLevel  || null,
        experienceLevel:     experienceLevel || null,
        skills:              Array.isArray(skills) ? skills : [],
        languages:           Array.isArray(languages) ? languages : [],
        status:              'PENDING', // validation admin requise
      },
    });

    res.status(201).json({
      success: true,
      message: 'Offre soumise avec succès, en attente de validation',
      data: { id: job.id },
    });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getJobs, getJobById, getFiltersCount, createJob };