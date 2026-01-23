import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables before creating PrismaClient
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Lazy Prisma client creation
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Cleans all data from the test database
 * Deletes in correct order to respect foreign key constraints
 */
export async function cleanDatabase(): Promise<void> {
  const db = getPrisma();
  // Delete in reverse order of dependencies
  await db.approvalHistory.deleteMany();
  await db.approval.deleteMany();
  await db.comment.deleteMany();
  await db.notification.deleteMany();
  await db.eventAttendee.deleteMany();
  await db.event.deleteMany();
  await db.taskDependency.deleteMany();
  await db.taskAssignee.deleteMany();
  await db.task.deleteMany();
  await db.projectKPI.deleteMany();
  await db.projectLog.deleteMany();
  await db.projectBudget.deleteMany();
  await db.projectTeam.deleteMany();
  await db.project.deleteMany();
  await db.client.deleteMany();
  await db.file.deleteMany();
  await db.auditLog.deleteMany();
  await db.systemSetting.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
}

/**
 * Seeds the database with test data
 * Creates users with different roles for testing
 */
export async function seedTestData(): Promise<{
  superAdmin: any;
  admin: any;
  pm: any;
  nvkd: any;
  designer: any;
  client: any;
  testClient: any;
}> {
  const db = getPrisma();
  const hashedPassword = await hash('Test@123', 10);

  // Create test users
  const superAdmin = await db.user.create({
    data: {
      email: 'superadmin@test.com',
      name: 'Super Admin Test',
      role: UserRole.SUPER_ADMIN,
      password: hashedPassword,
      isActive: true,
    },
  });

  const admin = await db.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      password: hashedPassword,
      isActive: true,
    },
  });

  const pm = await db.user.create({
    data: {
      email: 'pm@test.com',
      name: 'PM Test',
      role: UserRole.PM,
      password: hashedPassword,
      isActive: true,
    },
  });

  const nvkd = await db.user.create({
    data: {
      email: 'nvkd@test.com',
      name: 'NVKD Test',
      role: UserRole.NVKD,
      password: hashedPassword,
      isActive: true,
    },
  });

  const designer = await db.user.create({
    data: {
      email: 'designer@test.com',
      name: 'Designer Test',
      role: UserRole.DESIGN,
      password: hashedPassword,
      isActive: true,
    },
  });

  // Create test client company
  const testClient = await db.client.create({
    data: {
      companyName: 'Test Client Co.',
      contactName: 'Client Contact',
      contactEmail: 'client@testcompany.com',
      contactPhone: '0123456789',
      accessCode: 'TEST001',
      isActive: true,
    },
  });

  // Create client user
  const client = await db.user.create({
    data: {
      email: 'client@test.com',
      name: 'Client User Test',
      role: UserRole.PM, // Clients might use PM role or we need separate CLIENT role
      password: hashedPassword,
      isActive: true,
    },
  });

  return { superAdmin, admin, pm, nvkd, designer, client, testClient };
}

/**
 * Gets the Prisma client for direct database access in tests
 */
export function getPrismaClient(): PrismaClient {
  return getPrisma();
}

/**
 * Disconnects the Prisma client
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
