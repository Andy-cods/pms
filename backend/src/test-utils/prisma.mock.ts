/**
 * Shared PrismaService mock for unit testing.
 * Provides deep mock of all Prisma models used in the project.
 *
 * Usage:
 *   const prisma = createPrismaMock();
 *   // In TestingModule:
 *   { provide: PrismaService, useValue: prisma }
 */

const createModelMock = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

export const createPrismaMock = () => ({
  user: createModelMock(),
  client: createModelMock(),
  project: createModelMock(),
  task: createModelMock(),
  approval: createModelMock(),
  approvalHistory: createModelMock(),
  auditLog: createModelMock(),
  notification: createModelMock(),
  event: createModelMock(),
  projectTeam: createModelMock(),
  projectPhase: createModelMock(),
  projectPhaseItem: createModelMock(),
  budgetEvent: createModelMock(),
  mediaPlan: createModelMock(),
  mediaPlanItem: createModelMock(),
  adsReport: createModelMock(),
  strategicBrief: { ...createModelMock(), findUniqueOrThrow: jest.fn() },
  briefSection: createModelMock(),
  file: createModelMock(),
  comment: createModelMock(),
  stageHistory: createModelMock(),
  weeklyNote: createModelMock(),
  session: createModelMock(),
  $transaction: jest.fn((fn: (prisma: unknown) => unknown) => {
    const txPrisma = createPrismaMock();
    return fn(txPrisma);
  }),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
