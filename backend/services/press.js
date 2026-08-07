'use strict';

const cloudinary = require('cloudinary').v2;
const prisma = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── PUBLIC ────────────────────────────────────────────────────────────────────

async function getArticles(filters) {
  const {
    language,
    city,
    categoryId,
    contentType,
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
  if (contentType) where.contentType = contentType; // 'ARTICLE' | 'VIDEO'

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

// ── JOURNALIST SUBMISSIONS ────────────────────────────────────────────────────

const MAX_DESCRIPTION_LENGTH = 8000;
const MAX_TITLE_LENGTH = 200;
const VALID_CONTENT_TYPES = ['ARTICLE', 'VIDEO'];

const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 30;

function assertValidContentType(contentType) {
  if (contentType !== undefined && !VALID_CONTENT_TYPES.includes(contentType)) {
    const err = new Error('Type de contenu invalide.');
    err.code = 'INVALID_CONTENT_TYPE';
    throw err;
  }
}

function assertLengths({ title, description, isUpdate = false, contentType }) {
  // Sur update, les champs peuvent être undefined si non modifiés — on ne
  // valide que ce qui est réellement fourni, comme le fait déjà updateArticle.
  if (title !== undefined) {
    if (title.length > MAX_TITLE_LENGTH) {
      const err = new Error(`Le titre ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères.`);
      err.code = 'TITLE_TOO_LONG';
      throw err;
    }
    if (!isUpdate && title.trim().length < MIN_TITLE_LENGTH) {
      const err = new Error(`Le titre doit faire au moins ${MIN_TITLE_LENGTH} caractères.`);
      err.code = 'TITLE_TOO_SHORT';
      throw err;
    }
  }
  if (description !== undefined) {
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      const err = new Error(`La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`);
      err.code = 'DESCRIPTION_TOO_LONG';
      throw err;
    }
    // Description facultative pour une vidéo (elle porte le contenu elle-même,
    // contrairement à un article texte) — pas de minimum imposé dans ce cas.
    const descriptionRequired = !isUpdate && contentType !== 'VIDEO';
    if (descriptionRequired && description.trim().length < MIN_DESCRIPTION_LENGTH) {
      const err = new Error(`La description doit faire au moins ${MIN_DESCRIPTION_LENGTH} caractères.`);
      err.code = 'DESCRIPTION_TOO_SHORT';
      throw err;
    }
  }
}

// Les journalistes sont du staff de confiance créé par l'admin — publication
// directe sans file d'attente de modération, à la fois à la création et à l'édition.
async function createArticle(userId, { title, description, imageUrl, videoUrl, city, categoryId, language, contentType = 'ARTICLE' }) {
  assertValidContentType(contentType);
  assertLengths({ title, description, isUpdate: false, contentType });

  if (contentType === 'VIDEO') {
    if (!videoUrl) {
      const err = new Error('Une vidéo est requise pour publier ce contenu.');
      err.code = 'VIDEO_REQUIRED';
      throw err;
    }
  } else if (!imageUrl) {
    const err = new Error('Une photo est requise pour publier un article.');
    err.code = 'IMAGE_REQUIRED';
    throw err;
  }

  return prisma.newsArticle.create({
    data: {
      title,
      description,
      contentType,
      imageUrl: contentType === 'VIDEO' ? null : imageUrl,
      videoUrl: contentType === 'VIDEO' ? videoUrl : null,
      city: city || null,
      categoryId: categoryId || null,
      language,
      source: 'ORIGINAL',
      status: 'APPROVED',
      userId,
      publishedAt: new Date(),
    },
  });
}

async function updateArticle(id, userId, { title, description, imageUrl, videoUrl, city, categoryId, language, contentType }) {
  assertLengths({ title, description, isUpdate: true });
  assertValidContentType(contentType);

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

  // contentType ne change jamais en édition (pas prévu par le formulaire edit) —
  // on retombe sur celui déjà en base si non fourni, jamais sur un défaut ARTICLE.
  const effectiveContentType = contentType !== undefined ? contentType : existing.contentType;

  if (effectiveContentType === 'VIDEO') {
    const effectiveVideoUrl = videoUrl !== undefined ? videoUrl : existing.videoUrl;
    if (!effectiveVideoUrl) {
      const err = new Error('Une vidéo est requise pour publier ce contenu.');
      err.code = 'VIDEO_REQUIRED';
      throw err;
    }
  } else {
    const effectiveImageUrl = imageUrl !== undefined ? imageUrl : existing.imageUrl;
    if (!effectiveImageUrl) {
      const err = new Error('Une photo est requise pour publier un article.');
      err.code = 'IMAGE_REQUIRED';
      throw err;
    }
  }

  return prisma.newsArticle.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(city !== undefined && { city }),
      ...(categoryId !== undefined && { categoryId }),
      ...(language !== undefined && { language }),
      editCount: { increment: 1 },
    },
  });
}

// Extrait le public_id Cloudinary depuis une URL sécurisée, pour pouvoir
// supprimer le fichier réel (image ou vidéo) en plus de la ligne en base.
// Best-effort : si l'URL ne matche pas le format attendu, on abandonne sans
// bloquer la suppression de l'article (mieux vaut un fichier orphelin qu'un
// article que le journaliste n'arrive pas à supprimer).
function extractCloudinaryPublicId(url) {
  if (!url) return null;
  try {
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return null;
    const withoutVer = urlParts[1].replace(/^v\d+\//, '');
    return withoutVer.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

// Suppression définitive — réservée au journaliste auteur de l'article.
// Supprime aussi le média associé sur Cloudinary (best-effort, ne bloque pas
// la suppression de l'article si Cloudinary échoue).
async function deleteArticle(id, userId) {
  const existing = await prisma.newsArticle.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Article introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (existing.source !== 'ORIGINAL' || existing.userId !== userId) {
    const err = new Error('Non autorisé à supprimer cet article');
    err.code = 'FORBIDDEN';
    throw err;
  }

  await prisma.newsArticle.delete({ where: { id } });

  if (existing.contentType === 'VIDEO' && existing.videoUrl) {
    const publicId = extractCloudinaryPublicId(existing.videoUrl);
    if (publicId) {
      cloudinary.uploader.destroy(publicId, { resource_type: 'video' }).catch(() => {});
    }
  } else if (existing.imageUrl) {
    const publicId = extractCloudinaryPublicId(existing.imageUrl);
    if (publicId) {
      cloudinary.uploader.destroy(publicId).catch(() => {});
    }
  }

  return { id };
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
  deleteArticle,
  getMyArticles,
  createCategory,
};