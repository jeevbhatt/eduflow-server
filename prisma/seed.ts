/**
 * EduFlow Main Seed Orchestrator
 *
 * Runs:
 * 1. Admin seeding (Super Admin + Admin Institute)
 * 2. Institute seeding (300+ Nepal Institutes)
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting EduFlow Full Database Seeding...\n");

  // Global Clear
  console.log("🗑️  Performing global database cleanup...");
  await prisma.blog.deleteMany();
  await prisma.libraryResource.deleteMany();
  await prisma.libraryCategory.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.instituteJoinRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.institute.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleared\n");

  // Run Admin Seed
  console.log("➡️  Running Admin Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-admin.ts", { stdio: "inherit" });

  // Run Blogs Seed
  console.log("➡️  Running Blogs Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-blogs.ts", { stdio: "inherit" });

  // Run Institutes Seed
  console.log("➡️  Running Institutes Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-institutes.ts", { stdio: "inherit" });

  // Run Categories Seed
  console.log("➡️  Running Categories Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-categories.ts", { stdio: "inherit" });

  // Run Courses Seed
  console.log("➡️  Running Courses Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-courses.ts", { stdio: "inherit" });

  // Run Content Seed
  console.log("➡️  Running Content Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-content.ts", { stdio: "inherit" });

  // Run Library Seed
  console.log("➡️  Running Library Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-library.ts", { stdio: "inherit" });

  console.log("\n✨ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Main seed orchestrator failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
