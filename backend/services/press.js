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

  const where = {};

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
      include: { category: { select: { id: true, name: true, slug: true } } },
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
  return prisma.newsArticle.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
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

async function getCategories() {
  return prisma.category.findMany({
    where: { module: 'PRESS' },
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
};