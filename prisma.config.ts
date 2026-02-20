import { defineConfig } from '@prisma/config';

// Load .env for local development (no-ops if file doesn't exist)
try { require('dotenv/config'); } catch { }

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set!');
}

export default defineConfig({
    datasource: {
        url: databaseUrl,
    },
});
