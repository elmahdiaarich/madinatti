const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/jobs
const getJobs = async (req, res) => {
  try {
   const {
  page = 1,
  limit = 10,
  search = '',
  categoryId,
  contractType,
  location,
  educationLevel,   // 👈
  experienceLevel,  // 👈
  categorySlug,   // 👈
} = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
  status: 'PUBLISHED',
  ...(search && {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ],
  }),
  ...(categoryId && { categoryId }),
  ...(contractType && { contractType }),
  ...(educationLevel && { educationLevel }),   
  ...(experienceLevel && { experienceLevel }), 
   ...(categorySlug && { category: { slug: categorySlug }}),
  ...(location && { location: { contains: location, mode: 'insensitive' } }),
};

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
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
  category: {
    select: { id: true, name: true },
  },
  user: {                          // 👈 ajoute ça
    select: { companyLogo: true },
  },
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
// api/jobs/:id
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.jobListing.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
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
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Offre introuvable' });
    }

    if (job.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, message: 'Offre non disponible' });
    }

    // Incrémenter le compteur de vues
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

module.exports = { getJobs, getJobById };
