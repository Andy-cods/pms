import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Cleans all data from the test database
 * Deletes in correct order to respect foreign key constraints
 */
export async function cleanDatabase(): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.approvalHistory.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.event.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
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
  const hashedPassword = await hash('Test@123', 10);

  // Create test users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@test.com',
      name: 'Super Admin Test',
      role: UserRole.SUPER_ADMIN,
      password: hashedPassword,
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin Test',
      role: UserRole.ADMIN,
      password: hashedPassword,
      isActive: true,
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: 'pm@test.com',
      name: 'PM Test',
      role: UserRole.PM,
      password: hashedPassword,
      isActive: true,
    },
  });

  const nvkd = await prisma.user.create({
    data: {
      email: 'nvkd@test.com',
      name: 'NVKD Test',
      role: UserRole.NVKD,
      password: hashedPassword,
      isActive: true,
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: 'designer@test.com',
      name: 'Designer Test',
      role: UserRole.DESIGN,
      password: hashedPassword,
      isActive: true,
    },
  });

  // Create test client company
  const testClient = await prisma.client.create({
    data: {
      companyName: 'Test Client Co.',
      contactName: 'Client Contact',
      email: 'client@testcompany.com',
      phone: '0123456789',
      isActive: true,
    },
  });

  // Create client user
  const client = await prisma.user.create({
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
  return prisma;
}

/**
 * Disconnects the Prisma client
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
