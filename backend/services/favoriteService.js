// backend/services/favoriteService.js
const prisma = require('../config/db');

const toggleFavorite = async (userId, itemId, itemType) => {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_itemId_itemType: {
        userId,
        itemId,
        itemType,
      },
    },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: "removed", favorited: false };
  }
  await prisma.favorite.create({
    data: { userId, itemId, itemType },
  });
  return { action: "added", favorited: true };
};

const getUserFavorites = async (userId, itemType) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId, itemType },
    orderBy: { createdAt: "desc" },
    select: { id: true, itemId: true, createdAt: true },
  });
  if (!favorites.length) return [];
  const ids = favorites.map((f) => f.itemId);

  if (itemType === "TOURISM") {
    return prisma.touristicListing.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { category: true },
    });
  } else if (itemType === "PROFESSIONAL_SPACE") {
    return prisma.professionalSpaceListing.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { category: true },
    });
  } else if (itemType === "EVENT") {
    return prisma.event.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      include: { category: true },
    });
  }

  return [];
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
};
