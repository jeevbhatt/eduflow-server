# Prisma 7 + Supabase Setup Guide

## Overview

This server has been configured to use **Prisma ORM v7** with **Supabase PostgreSQL**. The setup uses:

- **Unified Multi-Tenant Schema**: 17 tables with `institute_id` for tenant isolation
- **Row Level Security (RLS)**: Database-level security policies
- **Dual Connection Strategy**: Pooled for runtime, direct for migrations

### Connection URLs

- **DATABASE_URL**: Pooled connection via Supavisor (port 6543) for runtime queries
- **DIRECT_URL**: Direct connection (port 5432) for migrations and CLI operations

### Schema Summary

| Category | Tables |
|----------|--------|
| **Auth** | users, sessions, refresh_tokens, security_logs |
| **Organization** | institutes |
| **Academic** | categories, courses, chapters, lessons |
| **People** | students, teachers |
| **Records** | attendance, assessments, assessment_results |
| **Relations** | student_courses, teacher_courses |

### RLS Policies

Apply `prisma/rls-policies.sql` in Supabase Dashboard → SQL Editor to enable Row Level Security.

## File Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Data models (NO url field in Prisma 7)
│   ├── rls-policies.sql   # Row Level Security policies
│   └── migrations/        # Database migrations (auto-generated)
├── prisma.config.ts       # CLI config - uses DIRECT_URL for migrations
├── src/
│   ├── database/
│   │   ├── prisma.ts      # Prisma client singleton (uses DATABASE_URL via adapter)
│   │   ├── connection.ts  # Legacy Sequelize connection (keep for migration)
│   │   └── models/        # Legacy Sequelize models (keep for migration)
│   └── generated/
│       └── prisma/        # Auto-generated Prisma client
└── .env                   # Environment variables
```

## Setup Instructions

### 1. Configure Supabase Connection

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **Database**
3. Copy the connection strings:

```env
# .env file

# Pooled connection (Transaction mode - port 6543) - Used by Prisma Client at runtime
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432) - Used by Prisma CLI for migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 2. Generate Prisma Client

```bash
# Generate the Prisma client
npm run prisma:generate

# Or directly
npx prisma generate
```

### 3. Run Migrations

```bash
# Development - creates migration and applies it
npm run prisma:migrate

# Production - only applies existing migrations
npm run prisma:migrate:prod

# Push schema without migrations (prototyping)
npm run prisma:push
```

### 4. Explore Data

```bash
# Open Prisma Studio (GUI for database)
npm run prisma:studio
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Create and apply migrations (dev) |
| `npm run prisma:migrate:prod` | Apply migrations (production) |
| `npm run prisma:push` | Push schema to DB without migrations |
| `npm run prisma:pull` | Pull schema from existing DB |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:reset` | Reset database and apply migrations |
| `npm run prisma:seed` | Run database seed script |

## Using Prisma Client (Prisma 7)

### Import the Client

```typescript
// Using default export
import prisma from '../database/prisma';

// Or named export
import { prisma } from '../database/prisma';
```

### How It Works (Prisma 7 Architecture)

```typescript
// src/database/prisma.ts
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

// Driver adapter handles connection at runtime
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### Example Queries

```typescript
// Create a user
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
  },
});

// Find user with relations
const userWithInstitutes = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
  include: { ownedInstitutes: true },
});

// Update with soft delete
const softDeleted = await prisma.user.update({
  where: { id: userId },
  data: {
    deletedAt: new Date(),
    deleteReason: 'User requested account deletion',
  },
});

// Query excluding soft-deleted
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

## Migration from Sequelize

### Phase 1: Parallel Operation (Current)
- Both Sequelize and Prisma are available
- New features should use Prisma
- Existing code continues with Sequelize

### Phase 2: Gradual Migration
Convert controllers one by one:

```typescript
// Before (Sequelize)
import User from '../database/models/userModel';
const user = await User.findOne({ where: { email } });

// After (Prisma)
import prisma from '../database/prisma';
const user = await prisma.user.findUnique({ where: { email } });
```

### Phase 3: Full Migration
1. Remove Sequelize models
2. Remove `connection.ts`
3. Remove `mysql2` dependency
4. Remove `sequelize-typescript` dependency

## Schema Models

### Current Models (Prisma)

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles, MFA, verification |
| `Institute` | Educational institutions with subscriptions |
| `Session` | Active user sessions for security |
| `RefreshToken` | JWT refresh token management |
| `SecurityLog` | Security audit trail |

### Enums

```prisma
enum UserRole {
  admin
  institute
  super_admin
  student
  teacher
}

enum AccountStatus {
  active
  suspended
  inactive
  pending_verification
}

enum SubscriptionTier {
  trial
  basic
  pro
  enterprise
}
```

## Best Practices

### 1. Always Use Soft Delete

```typescript
// Instead of delete, use soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// Filter out deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

### 2. Use Transactions for Related Operations

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const institute = await tx.institute.create({
    data: { ...instituteData, ownerId: user.id },
  });
  return { user, institute };
});
```

### 3. Handle Errors Properly

```typescript
import { Prisma } from '../generated/prisma';

try {
  await prisma.user.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

## Troubleshooting

### Connection Issues

1. **"Can't reach database server"**
   - Check if DIRECT_URL is correct for CLI operations
   - Verify Supabase project is active
   - Check network/firewall settings

2. **"Too many connections"**
   - Ensure using pooled DATABASE_URL for runtime
   - Check Prisma client singleton is being used
   - Review connection pool settings

3. **"Permission denied"**
   - Verify database user has required permissions
   - Check if Row Level Security (RLS) is blocking

### Migration Issues

1. **"Migration failed"**
   - Ensure DIRECT_URL is set (not pooled URL)
   - Check if database is accessible
   - Review migration SQL for syntax errors

2. **"Schema drift detected"**
   - Run `npx prisma migrate dev` to sync
   - Or `npx prisma db push` for prototyping

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
