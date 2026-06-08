// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
        },
      },
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[getCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;