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
const getFiltersCount = async (req, res) => {
  try {
    const baseWhere = { status: 'PUBLISHED' };
 
    // 1. Count par contractType
    const contractCounts = await prisma.jobListing.groupBy({
      by: ['contractType'],
      where: baseWhere,
      _count: { contractType: true },
    });
 
    // 2. Count par experienceLevel
    const experienceCounts = await prisma.jobListing.groupBy({
      by: ['experienceLevel'],
      where: baseWhere,
      _count: { experienceLevel: true },
    });
 
    // 3. Count par educationLevel
    const educationCounts = await prisma.jobListing.groupBy({
      by: ['educationLevel'],
      where: baseWhere,
      _count: { educationLevel: true },
    });
 
    // 4. Count par location (ville)
    const locationCounts = await prisma.jobListing.groupBy({
      by: ['location'],
      where: baseWhere,
      _count: { location: true },
      orderBy: { _count: { location: 'desc' } },
      take: 20, // top 20 villes
    });
 
    // 5. Count par catégorie (via Category)
    const categoryCounts = await prisma.category.findMany({
      where: {
        isActive: true,
        jobListings: { some: { status: 'PUBLISHED' } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            jobListings: { where: { status: 'PUBLISHED' } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
 
    // Transformer en objets { value: count }
    const toMap = (arr, key, countKey) =>
      arr.reduce((acc, item) => {
        if (item[key]) acc[item[key]] = item._count[countKey];
        return acc;
      }, {});
 
    res.json({
      success: true,
      data: {
        contractType: toMap(contractCounts, 'contractType', 'contractType'),
        experienceLevel: toMap(experienceCounts, 'experienceLevel', 'experienceLevel'),
        educationLevel: toMap(educationCounts, 'educationLevel', 'educationLevel'),
        location: toMap(locationCounts, 'location', 'location'),
        categories: categoryCounts.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.jobListings,
        })),
      },
    });
  } catch (error) {
    console.error('getFiltersCount error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getJobs, getJobById, getFiltersCount };
