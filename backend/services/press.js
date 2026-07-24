'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── PUBLIC ────────────────────────────────────────────────────────────────────

async function getArticles(filters) {
  const {
    language,
    city,
    categoryId,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const where = {
    // RSS: pas de status géré (toujours visible). ORIGINAL: doit être APPROVED.
    NOT: { AND: [{ source: 'ORIGINAL' }, { status: { not: 'APPROVED' } }] },
  };

  if (language) where.language = language; // 'AR' | 'FR'
  if (city) where.city = { contains: city.trim(), mode: 'insensitive' };
  if (categoryId) where.categoryId = categoryId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    articles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

async function getArticleById(id) {
  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { name: true } }, // auteur, uniquement pertinent si source === 'ORIGINAL'
    },
  });

  // Un article original non-approuvé reste invisible publiquement,
  // même si on connaît son ID directement (RSS n'a pas cette restriction).
  if (article && article.source === 'ORIGINAL' && article.status !== 'APPROVED') {
    return null;
  }

  return article;
}

async function getDistinctCities(language) {
  const where = { city: { not: null } };
  if (language) where.language = language;

  const rows = await prisma.newsArticle.findMany({
    where,
    select: { city: true },
    distinct: ['city'],
  });

  return rows.map((r) => r.city).filter(Boolean).sort();
}

async function getCategories(language) {
  const where = { module: 'PRESS' };
  // Si une langue est précisée, on ne retourne que les catégories
  // qui ont au moins un article dans cette langue.
  if (language) {
    where.news = { some: { language } };
  }
  return prisma.category.findMany({
    where,
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

// ── FAVORITES ─────────────────────────────────────────────────────────────────
// Mirrors services/cars.js toggleFavorite/getUserFavorites exactly, itemType: 'NEWS'.

async function toggleFavorite(userId, articleId) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_itemId_itemType: { userId, itemId: articleId, itemType: 'NEWS' } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: 'removed' };
  }
  await prisma.favorite.create({ data: { userId, itemId: articleId, itemType: 'NEWS' } });
  return { action: 'added' };
}

async function getUserFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, itemType: 'NEWS' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, itemId: true, createdAt: true },
  });
  if (!favorites.length) return [];

  const ids = favorites.map((f) => f.itemId);
  return prisma.newsArticle.findMany({
    where: { id: { in: ids } },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  });
}

// ── PURGE ──────────────────────────────────────────────────────────────────────

async function purgeOldArticles(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // Exclude favorites
  const favorites = await prisma.favorite.findMany({
    where: { itemType: 'NEWS' },
    select: { itemId: true },
  });
  const favoritedIds = favorites.map((f) => f.itemId);

  const { count } = await prisma.newsArticle.deleteMany({
    where: {
      publishedAt: { lt: cutoffDate },
      id: { notIn: favoritedIds },
      source: 'RSS', // les articles originaux ne sont jamais purgés automatiquement
    },
  });

  return count;
}

module.exports = {
  getArticles,
  getArticleById,
  getDistinctCities,
  getCategories,
  toggleFavorite,
  getUserFavorites,
  purgeOldArticles,
};// ── JOURNALIST SUBMISSIONS ────────────────────────────────────────────────────

const MAX_PENDING_ARTICLES = 5;
const MAX_DESCRIPTION_LENGTH = 8000;
const MAX_TITLE_LENGTH = 200;

function assertLengths({ title, description }) {
  if (title && title.length > MAX_TITLE_LENGTH) {
    const err = new Error(`Le titre ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères.`);
    err.code = 'TITLE_TOO_LONG';
    throw err;
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    const err = new Error(`La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`);
    err.code = 'DESCRIPTION_TOO_LONG';
    throw err;
  }
}

async function createArticle(userId, { title, description, imageUrl, city, categoryId, language }) {
  assertLengths({ title, description });

  if (!imageUrl) {
    const err = new Error('Une photo est requise pour publier un article.');
    err.code = 'IMAGE_REQUIRED';
    throw err;
  }

  const pendingCount = await prisma.newsArticle.count({
    where: { userId, source: 'ORIGINAL', status: 'PENDING' },
  });
  if (pendingCount >= MAX_PENDING_ARTICLES) {
    const err = new Error(
      `Vous avez déjà ${MAX_PENDING_ARTICLES} articles en attente de validation. Attendez qu'un admin les traite avant d'en soumettre de nouveaux.`
    );
    err.code = 'PENDING_LIMIT_REACHED';
    throw err;
  }

  return prisma.newsArticle.create({
    data: {
      title,
      description,
      imageUrl,
      city: city || null,
      categoryId: categoryId || null,
      language,
      source: 'ORIGINAL',
      status: 'PENDING',
      userId,
      publishedAt: new Date(),
    },
  });
}

async function updateArticle(id, userId, { title, description, imageUrl, city, categoryId, language }) {
  assertLengths({ title, description });

  const existing = await prisma.newsArticle.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Article introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.source !== 'ORIGINAL' || existing.userId !== userId) {
    const err = new Error('Non autorisé à modifier cet article');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const wasApproved = existing.status === 'APPROVED';

  return prisma.newsArticle.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(city !== undefined && { city }),
      ...(categoryId !== undefined && { categoryId }),
      ...(language !== undefined && { language }),
      // Toute édition d'un article déjà approuvé repasse en modération,
      // avec un snapshot de la version publiée pour permettre un diff admin.
      ...(wasApproved && {
        status: 'PENDING',
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: null,
        previousTitle: existing.title,
        previousDescription: existing.description,
        previousImageUrl: existing.imageUrl,
      }),
    },
  });
}

async function getMyArticles(userId) {
  return prisma.newsArticle.findMany({
    where: { userId, source: 'ORIGINAL' },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

function slugifyCategory(text) {
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createCategory(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    const err = new Error('Le nom de la catégorie est requis');
    err.code = 'INVALID_NAME';
    throw err;
  }
  const slug = slugifyCategory(trimmed);
  // Même convention que pressFetcher.js : pas de préfixe module dans le slug
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return { category: existing, alreadyExisted: true };
  }
  const category = await prisma.category.create({
    data: { name: trimmed, slug, module: 'PRESS' },
  });
  return { category, alreadyExisted: false };
}

module.exports = {
  getArticles,
  getArticleById,
  getDistinctCities,
  getCategories,
  toggleFavorite,
  getUserFavorites,
  purgeOldArticles,
  createArticle,
  updateArticle,
  getMyArticles,
  createCategory,
};