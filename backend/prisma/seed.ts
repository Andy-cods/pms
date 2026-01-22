import { PrismaClient, UserRole, ProjectStatus, ProjectStage, TaskStatus, TaskPriority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://bc_user:bc_password@localhost:5433/bc_pms';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data (for development)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.approvalHistory.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectLog.deleteMany();
  await prisma.projectKPI.deleteMany();
  await prisma.projectBudget.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // Create Users
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@bcagency.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('Created Super Admin:', superAdmin.email);

  const nvkd = await prisma.user.create({
    data: {
      email: 'sales@bcagency.com',
      password: hashedPassword,
      name: 'Nguyen Van Sales',
      role: UserRole.NVKD,
      isActive: true,
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: 'pm@bcagency.com',
      password: hashedPassword,
      name: 'Tran Thi PM',
      role: UserRole.PM,
      isActive: true,
    },
  });

  const planner = await prisma.user.create({
    data: {
      email: 'planner@bcagency.com',
      password: hashedPassword,
      name: 'Le Van Planner',
      role: UserRole.PLANNER,
      isActive: true,
    },
  });

  const content = await prisma.user.create({
    data: {
      email: 'content@bcagency.com',
      password: hashedPassword,
      name: 'Pham Thi Content',
      role: UserRole.CONTENT,
      isActive: true,
    },
  });

  const design = await prisma.user.create({
    data: {
      email: 'design@bcagency.com',
      password: hashedPassword,
      name: 'Hoang Van Design',
      role: UserRole.DESIGN,
      isActive: true,
    },
  });

  const media = await prisma.user.create({
    data: {
      email: 'media@bcagency.com',
      password: hashedPassword,
      name: 'Do Thi Media',
      role: UserRole.MEDIA,
      isActive: true,
    },
  });

  console.log('Created 7 users');

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      companyName: 'ABC Corporation',
      contactName: 'Nguyen Van Client',
      contactEmail: 'client@abc.com',
      contactPhone: '0901234567',
      accessCode: 'ABC123',
      isActive: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      companyName: 'XYZ Tech',
      contactName: 'Tran Thi Business',
      contactEmail: 'business@xyz.tech',
      contactPhone: '0987654321',
      accessCode: 'XYZ456',
      isActive: true,
    },
  });

  console.log('Created 2 clients');

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      code: 'QC01',
      name: 'ABC Corp - Q1 Marketing Campaign',
      description: 'Performance marketing campaign for Q1 2026',
      productType: 'Digital Marketing',
      status: ProjectStatus.STABLE,
      stage: ProjectStage.ONGOING,
      stageProgress: 60,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      timelineProgress: 25,
      clientId: client1.id,
      driveLink: 'https://drive.google.com/...',
      planLink: 'https://docs.google.com/...',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      code: 'QC02',
      name: 'XYZ Tech - Product Launch',
      description: 'New product launch campaign',
      productType: 'Product Launch',
      status: ProjectStatus.WARNING,
      stage: ProjectStage.PLANNING,
      stageProgress: 30,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-04-15'),
      timelineProgress: 10,
      clientId: client2.id,
    },
  });

  console.log('Created 2 projects');

  // Assign team to projects
  await prisma.projectTeam.createMany({
    data: [
      { projectId: project1.id, userId: nvkd.id, role: UserRole.NVKD, isPrimary: true },
      { projectId: project1.id, userId: pm.id, role: UserRole.PM, isPrimary: true },
      { projectId: project1.id, userId: planner.id, role: UserRole.PLANNER, isPrimary: true },
      { projectId: project1.id, userId: content.id, role: UserRole.CONTENT, isPrimary: true },
      { projectId: project1.id, userId: design.id, role: UserRole.DESIGN, isPrimary: true },
      { projectId: project1.id, userId: media.id, role: UserRole.MEDIA, isPrimary: true },
      { projectId: project2.id, userId: nvkd.id, role: UserRole.NVKD, isPrimary: true },
      { projectId: project2.id, userId: pm.id, role: UserRole.PM, isPrimary: true },
    ],
  });

  console.log('Assigned teams to projects');

  // Create Project Budget
  await prisma.projectBudget.create({
    data: {
      projectId: project1.id,
      totalBudget: 500000000, // 500M VND
      monthlyBudget: 166666667,
      spentAmount: 125000000,
      adServiceFee: 50000000,
      contentFee: 30000000,
      designFee: 20000000,
      mediaFee: 25000000,
      budgetPacing: 25.0,
    },
  });

  console.log('Created project budget');

  // Create Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Create content calendar for January',
      description: 'Plan and create content calendar for social media posts',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      estimatedHours: 8,
      actualHours: 10,
      deadline: new Date('2026-01-05'),
      createdById: pm.id,
      reviewerId: nvkd.id,
      completedAt: new Date('2026-01-04'),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Design social media posts batch 1',
      description: 'Create 20 social media post designs',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      estimatedHours: 16,
      deadline: new Date('2026-01-25'),
      createdById: pm.id,
      reviewerId: planner.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Write ad copy for Facebook campaigns',
      description: 'Create compelling ad copy for all Facebook ad sets',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      estimatedHours: 6,
      deadline: new Date('2026-01-28'),
      createdById: pm.id,
    },
  });

  // Assign users to tasks
  await prisma.taskAssignee.createMany({
    data: [
      { taskId: task1.id, userId: content.id },
      { taskId: task2.id, userId: design.id },
      { taskId: task3.id, userId: content.id },
    ],
  });

  console.log('Created 3 tasks with assignees');

  // Create Project KPIs
  await prisma.projectKPI.createMany({
    data: [
      { projectId: project1.id, kpiType: 'CPL', targetValue: 50000, actualValue: 45000, unit: 'VND' },
      { projectId: project1.id, kpiType: 'CTR', targetValue: 2.5, actualValue: 2.8, unit: '%' },
      { projectId: project1.id, kpiType: 'ROAS', targetValue: 3.0, actualValue: 3.2, unit: 'x' },
    ],
  });

  console.log('Created project KPIs');

  // Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'app_name', value: JSON.stringify('BC Agency PMS') },
      { key: 'default_language', value: JSON.stringify('vi') },
      { key: 'notification_email_enabled', value: JSON.stringify(true) },
      { key: 'notification_telegram_enabled', value: JSON.stringify(false) },
    ],
  });

  console.log('Created system settings');

  console.log('Seeding completed!');
  console.log('');
  console.log('Test Accounts:');
  console.log('  Super Admin: admin@bcagency.com / Admin@123');
  console.log('  Sales (NVKD): sales@bcagency.com / Admin@123');
  console.log('  PM: pm@bcagency.com / Admin@123');
  console.log('');
  console.log('Client Access Codes:');
  console.log('  ABC Corporation: ABC123');
  console.log('  XYZ Tech: XYZ456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
