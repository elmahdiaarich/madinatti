const prisma = require('../config/db');

const getCategories = async ({ module } = {}) => {
  const where = { isActive: true };
  if (module) where.module = module;

  return prisma.category.findMany({
    where,
    select: { id: true, name: true, slug: true, module: true },
    orderBy: { name: 'asc' },
  });
};

module.exports = { getCategories };