# Database Setup Guide

## Prerequisites

1. Install PostgreSQL on your system
2. Create a database named `ai_prototype_generator`
3. Update the `DATABASE_URL` in `.env` with your PostgreSQL credentials

## Setup Steps

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**:
   ```sql
   CREATE DATABASE ai_prototype_generator;
   ```

3. **Update Environment Variables**:
   Update `backend/.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_prototype_generator"
   ```

4. **Run Migrations**:
   ```bash
   cd backend
   npm run db:migrate
   ```

5. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

6. **Seed Database** (optional):
   ```bash
   npm run db:seed
   ```

## Database Schema Overview

The database includes the following tables:

- **users**: User accounts and preferences
- **projects**: AI prototype generation projects
- **generation_plans**: Generated plans for each project
- **code_sections**: Organized code sections (HTML, CSS, JS)
- **generation_logs**: Detailed logs of generation process

## Repository Pattern

All database operations use the repository pattern with the following repositories:

- `ProjectRepository`: Project CRUD operations
- `CodeSectionRepository`: Code section management
- `GenerationPlanRepository`: Plan management
- `GenerationLogRepository`: Generation logging

Each repository provides type-safe methods for database operations and includes proper error handling.