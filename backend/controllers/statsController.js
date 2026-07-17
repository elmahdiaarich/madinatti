const prisma = require('../config/db');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /api/business/stats/overview
 * KPIs globaux : vues totales, candidatures/demandes, taux de conversion, répartition par statut
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [jobListings, realEstateListings] = await Promise.all([
      prisma.jobListing.findMany({
        where: { userId, deletedByOwner: false },
        select: { id: true, viewsCount: true, status: true, _count: { select: { applications: true } } },
      }),
      prisma.realEstateListing.findMany({
        where: { userId, deletedByOwner: false },
        select: { id: true, viewsCount: true, status: true, _count: { select: { inquiries: true } } },
      }),
    ]);

    const sumViews = (arr) => arr.reduce((sum, l) => sum + l.viewsCount, 0);
    const totalApplications = jobListings.reduce((sum, j) => sum + j._count.applications, 0);
    const totalInquiries = realEstateListings.reduce((sum, r) => sum + r._count.inquiries, 0);
    const totalViews = sumViews(jobListings) + sumViews(realEstateListings);
    const totalConversions = totalApplications + totalInquiries;
    const conversionRate = totalViews > 0 ? +((totalConversions / totalViews) * 100).toFixed(2) : 0;

    const countByStatus = (listings) =>
      listings.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      }, {});

    res.json({
      totalViews,
      totalListings: jobListings.length + realEstateListings.length,
      totalApplications,
      totalInquiries,
      conversionRate,
      jobs: {
        count: jobListings.length,
        viewsCount: sumViews(jobListings),
        applications: totalApplications,
        statusBreakdown: countByStatus(jobListings),
      },
      realEstate: {
        count: realEstateListings.length,
        viewsCount: sumViews(realEstateListings),
        inquiries: totalInquiries,
        statusBreakdown: countByStatus(realEstateListings),
      },
    });
  } catch (err) {
    console.error('getOverview error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement des statistiques' });
  }
};

/**
 * GET /api/business/stats/views-timeline?days=30&type=JOB|REAL_ESTATE
 * Courbe des vues jour par jour, basée sur le modèle ListingView
 */
const getViewsTimeline = async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const type = req.query.type; // optionnel : "JOB" ou "REAL_ESTATE"
    const since = daysAgo(days);

    const [jobIds, realEstateIds] = await Promise.all([
      prisma.jobListing.findMany({ where: { userId }, select: { id: true } }),
      prisma.realEstateListing.findMany({ where: { userId }, select: { id: true } }),
    ]);

    const listingIds = [];
    if (!type || type === 'JOB') listingIds.push(...jobIds.map((j) => j.id));
    if (!type || type === 'REAL_ESTATE') listingIds.push(...realEstateIds.map((r) => r.id));

    const views = await prisma.listingView.findMany({
      where: { listingId: { in: listingIds }, viewedAt: { gte: since } },
      select: { viewedAt: true },
    });

    const grouped = {};
    for (let i = 0; i <= days; i++) {
      const key = daysAgo(days - i).toISOString().split('T')[0];
      grouped[key] = 0;
    }
    views.forEach((v) => {
      const key = v.viewedAt.toISOString().split('T')[0];
      if (grouped[key] !== undefined) grouped[key]++;
    });

    res.json({ timeline: Object.entries(grouped).map(([date, count]) => ({ date, views: count })) });
  } catch (err) {
    console.error('getViewsTimeline error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement de la courbe des vues' });
  }
};

/**
 * GET /api/business/stats/top-listings?limit=5
 * Classement des annonces les plus performantes (vues + conversions)
 */
const getTopListings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const [topJobs, topRealEstate] = await Promise.all([
      prisma.jobListing.findMany({
        where: { userId, deletedByOwner: false },
        orderBy: { viewsCount: 'desc' },
        take: limit,
        select: { id: true, title: true, viewsCount: true, status: true, isFeatured: true, _count: { select: { applications: true } } },
      }),
      prisma.realEstateListing.findMany({
        where: { userId, deletedByOwner: false },
        orderBy: { viewsCount: 'desc' },
        take: limit,
        select: { id: true, title: true, viewsCount: true, status: true, isFeatured: true, _count: { select: { inquiries: true } } },
      }),
    ]);

    const formatted = [
      ...topJobs.map((j) => ({ id: j.id, type: 'JOB', title: j.title, views: j.viewsCount, conversions: j._count.applications, status: j.status, isFeatured: j.isFeatured })),
      ...topRealEstate.map((r) => ({ id: r.id, type: 'REAL_ESTATE', title: r.title, views: r.viewsCount, conversions: r._count.inquiries, status: r.status, isFeatured: r.isFeatured })),
    ]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    res.json({ topListings: formatted });
  } catch (err) {
    console.error('getTopListings error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement du classement' });
  }
};

/**
 * GET /api/business/stats/boost-impact
 * Compare la moyenne de vues entre annonces boostées (isFeatured/isSponsored) et normales
 */
const getBoostImpact = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [jobListings, realEstateListings] = await Promise.all([
      prisma.jobListing.findMany({ where: { userId, deletedByOwner: false }, select: { viewsCount: true, isFeatured: true, isSponsored: true } }),
      prisma.realEstateListing.findMany({ where: { userId, deletedByOwner: false }, select: { viewsCount: true, isFeatured: true, isSponsored: true } }),
    ]);

    const all = [...jobListings, ...realEstateListings];
    const boosted = all.filter((l) => l.isFeatured || l.isSponsored);
    const regular = all.filter((l) => !l.isFeatured && !l.isSponsored);
    const avg = (arr) => (arr.length ? +(arr.reduce((s, l) => s + l.viewsCount, 0) / arr.length).toFixed(1) : 0);

    res.json({
      boostedAvgViews: avg(boosted),
      regularAvgViews: avg(regular),
      boostedCount: boosted.length,
      regularCount: regular.length,
    });
  } catch (err) {
    console.error('getBoostImpact error:', err);
    res.status(500).json({ message: "Erreur lors du calcul de l'impact du boost" });
  }
};

module.exports = { getOverview, getViewsTimeline, getTopListings, getBoostImpact };