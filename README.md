# ServeSync Backend

A modern backend API server built with Express, TypeScript, and Prisma ORM.

## Features

- **Express.js** - Fast and minimal web framework
- **TypeScript** - Type-safe development
- **Prisma** - Next-generation ORM for database management
- **Environment Configuration** - Manage settings via .env files
- **ESLint** - Code quality and style

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (or other supported database)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update your database URL:

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/servesync_db"
```

### 3. Setup Database

Run Prisma migrations:

```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build project to dist folder
- `npm start` - Run production build
- `npm run prisma:migrate` - Create and run database migrations
- `npm run prisma:studio` - Open Prisma Studio to view/manage data
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
ServeSync/
├── src/
│   └── index.ts         # Main server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Fetch all users

## Database

This project uses PostgreSQL by default. Update `prisma/schema.prisma` to change the database provider if needed.

## Development Tips

- Modify `prisma/schema.prisma` to define your data models
- Run `npm run prisma:migrate -- --name <migration_name>` to create migrations
- Use `npm run prisma:studio` to manage data with a visual interface
- TypeScript errors will be caught at compile time

## License

ISC
