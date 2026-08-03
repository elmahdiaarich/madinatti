const prisma = require('../config/db');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function countByStatus(listings) {
  return listings.reduce((acc, listing) => {
    acc[listing.status] = (acc[listing.status] || 0) + 1;
    return acc;
  }, {});
}

function hasImages(images) {
  return Array.isArray(images) && images.length > 0;
}

function listingHealth({ jobs, realEstate, cars }) {
  const all = [
    ...jobs.map((item) => ({ ...item, module: 'JOB', hasPhone: true, hasImages: true })),
    ...realEstate.map((item) => ({ ...item, module: 'REAL_ESTATE', hasPhone: Boolean(item.contactPhone), hasImages: hasImages(item.images) })),
    ...cars.map((item) => ({ ...item, module: 'CAR', hasPhone: Boolean(item.contactPhone), hasImages: hasImages(item.images) })),
  ];
  return {
    approved: all.filter((item) => item.status === 'APPROVED').length,
    pending: all.filter((item) => item.status === 'PENDING').length,
    rejected: all.filter((item) => item.status === 'REJECTED').length,
    missingImages: all.filter((item) => !item.hasImages).length,
    missingPhone: all.filter((item) => !item.hasPhone).length,
    lowViews: all.filter((item) => item.status === 'APPROVED' && Number(item.viewsCount || 0) < 10).length,
  };
}

function buildRecommendations({ user, health, totalViews, totalConversions, cars }) {
  const items = [];
  if (!user.companyLogo) items.push('Ajoutez un logo entreprise pour rendre le badge boutique plus credible.');
  if (!user.boutiqueBanner) items.push('Ajoutez une banniere boutique pour donner une vraie identite a votre vitrine.');
  if (!user.boutiqueDescription) items.push('Ajoutez une description courte: specialite, ville, garanties et horaires.');
  if (health.missingPhone > 0) items.push(`${health.missingPhone} annonce(s) n'ont pas de telephone public. Les contacts risquent de baisser.`);
  if (health.missingImages > 0) items.push(`${health.missingImages} annonce(s) n'ont pas d'image. Ajoutez au moins 3 photos.`);
  if (totalViews > 50 && totalConversions / totalViews < 0.03) items.push('Vos vues sont correctes mais les contacts sont faibles: verifiez les prix et le texte des annonces.');
  const boostedCars = cars.filter((item) => item.isFeatured || item.isSponsored).length;
  if (cars.length > 0 && boostedCars === 0) items.push('Boostez votre meilleure annonce vehicule pour tester l impact sur les contacts.');
  return items.slice(0, 5);
}

function cityInsights(listings) {
  const counts = {};
  listings.forEach((item) => {
    const city = item.city || item.location || 'Non renseignee';
    counts[city] = (counts[city] || 0) + Number(item.viewsCount || 0);
  });
  return Object.entries(counts)
    .map(([city, views]) => ({ city, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
}

async function getUserWithPlan(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      companyName: true,
      companyLogo: true,
      companyWebsite: true,
      boutiqueDescription: true,
      boutiqueBanner: true,
      subscriptions: {
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        include: { plan: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });
}

const getOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [user, jobListings, realEstateListings, carListings] = await Promise.all([
      getUserWithPlan(userId),
      prisma.jobListing.findMany({
        where: { userId, deletedByOwner: false },
        select: { id: true, title: true, city: true, location: true, viewsCount: true, status: true, isFeatured: true, isSponsored: true, _count: { select: { applications: true } } },
      }),
      prisma.realEstateListing.findMany({
        where: { userId, deletedByOwner: false },
        select: { id: true, title: true, city: true, location: true, viewsCount: true, status: true, contactPhone: true, images: true, isFeatured: true, isSponsored: true, _count: { select: { inquiries: true } } },
      }),
      prisma.carListing.findMany({
        where: { userId, deletedByOwner: false },
        select: { id: true, title: true, city: true, location: true, viewsCount: true, status: true, contactPhone: true, images: true, isFeatured: true, isSponsored: true, _count: { select: { inquiries: true } } },
      }),
    ]);

    const totalApplications = jobListings.reduce((total, item) => total + item._count.applications, 0);
    const realEstateInquiries = realEstateListings.reduce((total, item) => total + item._count.inquiries, 0);
    const carInquiries = carListings.reduce((total, item) => total + item._count.inquiries, 0);
    const totalInquiries = realEstateInquiries + carInquiries;
    const totalViews = sum(jobListings, 'viewsCount') + sum(realEstateListings, 'viewsCount') + sum(carListings, 'viewsCount');
    const totalConversions = totalApplications + totalInquiries;
    const conversionRate = totalViews > 0 ? +((totalConversions / totalViews) * 100).toFixed(2) : 0;
    const health = listingHealth({ jobs: jobListings, realEstate: realEstateListings, cars: carListings });
    const allListings = [...jobListings, ...realEstateListings, ...carListings];
    const subscription = user?.subscriptions?.[0] || null;

    res.json({
      totalViews,
      totalListings: jobListings.length + realEstateListings.length + carListings.length,
      totalApplications,
      totalInquiries,
      totalContacts: totalConversions,
      conversionRate,
      boutique: {
        name: user?.companyName || user?.name || 'Boutique',
        logo: user?.companyLogo || null,
        slug: `business-${userId}`,
        url: `/boutiques/business-${userId}`,
        isVerified: Boolean(subscription?.plan?.hasBadge),
        plan: subscription?.plan ? { id: subscription.plan.id, name: subscription.plan.name } : null,
        visits: totalViews,
      },
      listingHealth: health,
      audience: {
        topCities: cityInsights(allListings),
        devices: [
          { label: 'Mobile', value: 72 },
          { label: 'Desktop', value: 24 },
          { label: 'Tablette', value: 4 },
        ],
        sources: [
          { label: 'Annonces', value: Math.max(0, totalViews - Math.round(totalViews * 0.18)) },
          { label: 'Boutique', value: Math.round(totalViews * 0.18) },
          { label: 'Recherche', value: Math.round(totalViews * 0.34) },
        ],
      },
      recommendations: buildRecommendations({ user, health, totalViews, totalConversions, cars: carListings }),
      jobs: {
        count: jobListings.length,
        viewsCount: sum(jobListings, 'viewsCount'),
        applications: totalApplications,
        statusBreakdown: countByStatus(jobListings),
      },
      realEstate: {
        count: realEstateListings.length,
        viewsCount: sum(realEstateListings, 'viewsCount'),
        inquiries: realEstateInquiries,
        statusBreakdown: countByStatus(realEstateListings),
      },
      cars: {
        count: carListings.length,
        viewsCount: sum(carListings, 'viewsCount'),
        inquiries: carInquiries,
        statusBreakdown: countByStatus(carListings),
      },
    });
  } catch (err) {
    console.error('getOverview error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement des statistiques' });
  }
};

const getViewsTimeline = async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const type = req.query.type;
    const since = daysAgo(days);

    const [jobIds, realEstateIds, carIds] = await Promise.all([
      prisma.jobListing.findMany({ where: { userId }, select: { id: true } }),
      prisma.realEstateListing.findMany({ where: { userId }, select: { id: true } }),
      prisma.carListing.findMany({ where: { userId }, select: { id: true } }),
    ]);

    const listingIds = [];
    if (!type || type === 'JOB') listingIds.push(...jobIds.map((item) => item.id));
    if (!type || type === 'REAL_ESTATE') listingIds.push(...realEstateIds.map((item) => item.id));
    if (!type || type === 'CAR') listingIds.push(...carIds.map((item) => item.id));

    const views = listingIds.length
      ? await prisma.listingView.findMany({
          where: { listingId: { in: listingIds }, viewedAt: { gte: since } },
          select: { viewedAt: true },
        })
      : [];

    const grouped = {};
    for (let i = 0; i <= days; i++) {
      const key = daysAgo(days - i).toISOString().split('T')[0];
      grouped[key] = 0;
    }
    views.forEach((view) => {
      const key = view.viewedAt.toISOString().split('T')[0];
      if (grouped[key] !== undefined) grouped[key]++;
    });

    res.json({ timeline: Object.entries(grouped).map(([date, count]) => ({ date, views: count })) });
  } catch (err) {
    console.error('getViewsTimeline error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement de la courbe des vues' });
  }
};

const getTopListings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);
    const [topJobs, topRealEstate, topCars] = await Promise.all([
      prisma.jobListing.findMany({
        where: { userId, deletedByOwner: false },
        orderBy: { viewsCount: 'desc' },
        take: limit,
        select: { id: true, title: true, companyLogo: true, city: true, viewsCount: true, status: true, isFeatured: true, isSponsored: true, _count: { select: { applications: true } } },
      }),
      prisma.realEstateListing.findMany({
        where: { userId, deletedByOwner: false },
        orderBy: { viewsCount: 'desc' },
        take: limit,
        select: { id: true, title: true, images: true, city: true, viewsCount: true, status: true, isFeatured: true, isSponsored: true, _count: { select: { inquiries: true } } },
      }),
      prisma.carListing.findMany({
        where: { userId, deletedByOwner: false },
        orderBy: { viewsCount: 'desc' },
        take: limit,
        select: { id: true, title: true, slug: true, images: true, city: true, price: true, viewsCount: true, status: true, isFeatured: true, isSponsored: true, _count: { select: { inquiries: true } } },
      }),
    ]);

    const cover = (images) => {
      const first = Array.isArray(images) ? images.find((img) => img?.isCover) || images[0] : null;
      return typeof first === 'string' ? first : first?.url || null;
    };
    const formatted = [
      ...topJobs.map((item) => ({ id: item.id, type: 'JOB', module: 'jobs', href: `/jobs/${item.id}`, title: item.title, image: item.companyLogo, city: item.city, views: item.viewsCount, conversions: item._count.applications, status: item.status, isFeatured: item.isFeatured, isSponsored: item.isSponsored })),
      ...topRealEstate.map((item) => ({ id: item.id, type: 'REAL_ESTATE', module: 'real-estate', href: `/real-estate/${item.id}`, title: item.title, image: cover(item.images), city: item.city, views: item.viewsCount, conversions: item._count.inquiries, status: item.status, isFeatured: item.isFeatured, isSponsored: item.isSponsored })),
      ...topCars.map((item) => ({ id: item.id, type: 'CAR', module: 'cars', href: `/cars/${item.slug || item.id}`, title: item.title, image: cover(item.images), city: item.city, price: Number(item.price || 0), views: item.viewsCount, conversions: item._count.inquiries, status: item.status, isFeatured: item.isFeatured, isSponsored: item.isSponsored })),
    ]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    res.json({ topListings: formatted });
  } catch (err) {
    console.error('getTopListings error:', err);
    res.status(500).json({ message: 'Erreur lors du chargement du classement' });
  }
};

const getBoostImpact = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [jobListings, realEstateListings, carListings] = await Promise.all([
      prisma.jobListing.findMany({ where: { userId, deletedByOwner: false }, select: { viewsCount: true, isFeatured: true, isSponsored: true } }),
      prisma.realEstateListing.findMany({ where: { userId, deletedByOwner: false }, select: { viewsCount: true, isFeatured: true, isSponsored: true } }),
      prisma.carListing.findMany({ where: { userId, deletedByOwner: false }, select: { viewsCount: true, isFeatured: true, isSponsored: true } }),
    ]);

    const all = [...jobListings, ...realEstateListings, ...carListings];
    const boosted = all.filter((item) => item.isFeatured || item.isSponsored);
    const regular = all.filter((item) => !item.isFeatured && !item.isSponsored);
    const avg = (items) => (items.length ? +(items.reduce((total, item) => total + item.viewsCount, 0) / items.length).toFixed(1) : 0);
    const boostedAvgViews = avg(boosted);
    const regularAvgViews = avg(regular);
    res.json({
      boostedAvgViews,
      regularAvgViews,
      boostedCount: boosted.length,
      regularCount: regular.length,
      extraContactsEstimate: Math.max(0, Math.round((boostedAvgViews - regularAvgViews) * 0.07 * boosted.length)),
    });
  } catch (err) {
    console.error('getBoostImpact error:', err);
    res.status(500).json({ message: "Erreur lors du calcul de l'impact du boost" });
  }
};

module.exports = { getOverview, getViewsTimeline, getTopListings, getBoostImpact };
