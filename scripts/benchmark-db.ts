/**
 * Database Performance Benchmark Script (Safe Version)
 *
 * This script measures query performance on existing tables only.
 * Run with: npx ts-node scripts/benchmark-db.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

interface BenchmarkResult {
  name: string;
  queryTime: number;
  rowsAffected?: number;
  error?: string;
}

const results: BenchmarkResult[] = [];

async function measureQuery(name: string, queryFn: () => Promise<any>): Promise<BenchmarkResult> {
  const start = performance.now();
  try {
    const result = await queryFn();
    const end = performance.now();
    const queryTime = end - start;

    const rowsAffected = Array.isArray(result) ? result.length : (result ? 1 : 0);

    const benchmark: BenchmarkResult = { name, queryTime, rowsAffected };
    results.push(benchmark);

    console.log(`✓ [${name}] ${queryTime.toFixed(2)}ms (${rowsAffected} rows)`);
    return benchmark;
  } catch (error: any) {
    const end = performance.now();
    const benchmark: BenchmarkResult = {
      name,
      queryTime: end - start,
      error: error.code || error.message
    };
    results.push(benchmark);
    console.log(`✗ [${name}] SKIPPED - ${error.code || 'Table not found'}`);
    return benchmark;
  }
}

async function runBenchmarks() {
  console.log("\n========================================");
  console.log("DATABASE PERFORMANCE BENCHMARK");
  console.log("========================================\n");

  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection warmed up.\n");

  // =============================================
  // USER QUERIES
  // =============================================

  console.log("--- USER QUERIES ---");

  await measureQuery("User.findByEmail", () =>
    prisma.user.findFirst({ where: { email: "admin@eduflow.com" } })
  );

  await measureQuery("User.count", () =>
    prisma.user.count()
  );

  console.log("\n--- INSTITUTE QUERIES ---");

  await measureQuery("Institute.findAll", () =>
    prisma.institute.findMany({ take: 10 })
  );

  await measureQuery("Institute.findBySubdomain", () =>
    prisma.institute.findFirst({ where: { subdomain: "demo" } })
  );

  console.log("\n--- STUDENT/TEACHER QUERIES ---");

  await measureQuery("Student.findByInstitute", () =>
    prisma.student.findMany({ take: 10 })
  );

  await measureQuery("Teacher.findByInstitute", () =>
    prisma.teacher.findMany({ take: 10 })
  );

  console.log("\n--- COURSE QUERIES ---");

  await measureQuery("Course.findWithPagination", () =>
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    })
  );

  await measureQuery("Category.findAll", () =>
    prisma.category.findMany({ take: 10 })
  );

  console.log("\n--- NOTIFICATION QUERIES ---");

  await measureQuery("Notification.findUnread", () =>
    prisma.notification.findMany({
      where: { isRead: false },
      take: 20
    })
  );

  console.log("\n--- SESSION QUERIES ---");

  await measureQuery("Session.findActive", () =>
    prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      take: 10
    })
  );

  // =============================================
  // SUMMARY
  // =============================================

  console.log("\n========================================");
  console.log("BENCHMARK SUMMARY");
  console.log("========================================\n");

  const successfulQueries = results.filter(r => !r.error);
  const failedQueries = results.filter(r => r.error);

  if (successfulQueries.length > 0) {
    const totalTime = successfulQueries.reduce((sum, r) => sum + r.queryTime, 0);
    const avgTime = totalTime / successfulQueries.length;
    const slowest = successfulQueries.reduce((max, r) => r.queryTime > max.queryTime ? r : max);
    const fastest = successfulQueries.reduce((min, r) => r.queryTime < min.queryTime ? r : min);

    console.log(`Successful Queries: ${successfulQueries.length}`);
    console.log(`Skipped (missing tables): ${failedQueries.length}`);
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${avgTime.toFixed(2)}ms`);
    console.log(`Slowest: ${slowest.name} (${slowest.queryTime.toFixed(2)}ms)`);
    console.log(`Fastest: ${fastest.name} (${fastest.queryTime.toFixed(2)}ms)`);

    // Identify slow queries (> 100ms)
    const slowQueries = successfulQueries.filter(r => r.queryTime > 100);
    if (slowQueries.length > 0) {
      console.log("\n⚠️  SLOW QUERIES (>100ms):");
      slowQueries.forEach(q => {
        console.log(`  - ${q.name}: ${q.queryTime.toFixed(2)}ms`);
      });
    } else {
      console.log("\n✅ All queries under 100ms - Good performance!");
    }
  }

  await prisma.$disconnect();
  console.log("\nBenchmark complete!");
}

// Run
runBenchmarks()
  .catch(err => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
