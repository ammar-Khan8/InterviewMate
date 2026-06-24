import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (typeof window === 'undefined') {
  // Prisma 7 SQLite driver adapter takes a configuration object containing the URL
  if (!globalForPrisma.prisma) {
    const dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace('file:', '');
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
} else {
  prisma = null as any;
}

export { prisma };
