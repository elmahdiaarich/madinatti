// backend/config/db.js
const { PrismaClient } = require('@prisma/client');

// Prevents multiple instances of Prisma Client from being created in memory
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;