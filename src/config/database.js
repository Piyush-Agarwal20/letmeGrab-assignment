const { PrismaClient } = require('../prisma/generated/main');

// Create a single Prisma Client instance
// Add pgbouncer parameter to disable prepared statements for connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true',
    },
  },
});

// Handle cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;