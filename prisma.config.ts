import { defineConfig } from '@prisma/config';

// Load .env for local development (no-ops if file doesn't exist)
try { require('dotenv/config'); } catch { }

export default defineConfig({
    datasource: {
        // During build (prisma generate), DATABASE_URL may not exist — that's OK.
        // It's only required at runtime (prisma migrate deploy, app start).
        url: process.env.DATABASE_URL || 'postgresql://placeholder:5432/placeholder',
    },
});
