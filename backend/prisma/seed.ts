import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  ProjectStage,
  TaskStatus,
  TaskPriority,
  BudgetEventType,
  BudgetEventCategory,
  BudgetEventStatus,
  ApprovalType,
  ApprovalStatus,
  EventType,
  MediaPlanStatus,
  MediaPlanType,
  AdsReportPeriod,
  AdsPlatform,
  AdsReportSource,
  PipelineStage,
  PipelineDecision,
  BriefStatus,
  ClientTier,
  ProjectPhaseType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://bc_user:bc_password@localhost:5433/bc_pms';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const d = (s: string) => new Date(s);

async function main() {
  console.log('Seeding database with comprehensive sample data...\n');

  // ═══════════════════════════════════════════════════════
  // CLEANUP - delete in dependency order
  // ═══════════════════════════════════════════════════════
  console.log('Cleaning existing data...');
  await prisma.briefSection.deleteMany();
  await prisma.strategicBrief.deleteMany();
  await prisma.projectPhaseItem.deleteMany();
  await prisma.projectPhase.deleteMany();
  await prisma.salesPipeline.deleteMany();
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
  await prisma.stageHistory.deleteMany();
  await prisma.adsReport.deleteMany();
  await prisma.budgetEvent.deleteMany();
  await prisma.mediaPlanItem.deleteMany();
  await prisma.mediaPlan.deleteMany();
  await prisma.projectBudget.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();
  console.log('Cleanup done.\n');

  // ═══════════════════════════════════════════════════════
  // USERS - all 10 roles
  // ═══════════════════════════════════════════════════════
  const pw = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({ data: { email: 'admin@bcagency.com', password: pw, name: 'Nguyen Van Admin', role: UserRole.SUPER_ADMIN, isActive: true } });
  await prisma.user.create({ data: { email: 'admin2@bcagency.com', password: pw, name: 'Le Thi Quan Ly', role: UserRole.ADMIN, isActive: true } });
  const technical = await prisma.user.create({ data: { email: 'tech@bcagency.com', password: pw, name: 'Pham Van Ky Thuat', role: UserRole.TECHNICAL, isActive: true } });
  const nvkd = await prisma.user.create({ data: { email: 'sales@bcagency.com', password: pw, name: 'Tran Thi Sales', role: UserRole.NVKD, isActive: true } });
  const pm = await prisma.user.create({ data: { email: 'pm@bcagency.com', password: pw, name: 'Vo Van PM', role: UserRole.PM, isActive: true } });
  const planner = await prisma.user.create({ data: { email: 'planner@bcagency.com', password: pw, name: 'Dang Thi Planner', role: UserRole.PLANNER, isActive: true } });
  const account = await prisma.user.create({ data: { email: 'account@bcagency.com', password: pw, name: 'Bui Van Account', role: UserRole.ACCOUNT, isActive: true } });
  const content = await prisma.user.create({ data: { email: 'content@bcagency.com', password: pw, name: 'Hoang Thi Content', role: UserRole.CONTENT, isActive: true } });
  const design = await prisma.user.create({ data: { email: 'design@bcagency.com', password: pw, name: 'Ly Van Design', role: UserRole.DESIGN, isActive: true } });
  const media = await prisma.user.create({ data: { email: 'media@bcagency.com', password: pw, name: 'Ngo Thi Media', role: UserRole.MEDIA, isActive: true } });
  console.log('Created 10 users (all roles)');

  // ═══════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════
  const client1 = await prisma.client.create({
    data: { companyName: 'ABC Corporation', contactName: 'Nguyen Minh Khoa', contactEmail: 'khoa@abc-corp.vn', contactPhone: '0901234567', accessCode: 'ABC123', isActive: true },
  });
  const client2 = await prisma.client.create({
    data: { companyName: 'XYZ Tech Solutions', contactName: 'Tran Quoc Bao', contactEmail: 'bao@xyztech.io', contactPhone: '0987654321', accessCode: 'XYZ456', isActive: true },
  });
  const client3 = await prisma.client.create({
    data: { companyName: 'MNO F&B Group', contactName: 'Le Hoang Anh', contactEmail: 'anh@mnofb.vn', contactPhone: '0912345678', accessCode: 'MNO789', isActive: true },
  });
  console.log('Created 3 clients');

  // ═══════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════
  const p1 = await prisma.project.create({
    data: {
      code: 'ABC-Q1', name: 'ABC Corp - Q1 Digital Marketing', description: 'Chien dich marketing so Q1/2026 cho ABC Corporation. Tap trung quang cao Facebook, Google va content marketing.',
      productType: 'Digital Marketing', status: ProjectStatus.STABLE, stage: ProjectStage.ONGOING, stageProgress: 65,
      startDate: d('2026-01-01'), endDate: d('2026-03-31'), timelineProgress: 30, clientId: client1.id,
      driveLink: 'https://drive.google.com/drive/folders/abc-q1', planLink: 'https://docs.google.com/spreadsheets/abc-q1',
    },
  });
  const p2 = await prisma.project.create({
    data: {
      code: 'XYZ-LAUNCH', name: 'XYZ Tech - Product Launch SaaS', description: 'Ra mat san pham SaaS moi cua XYZ Tech. Bao gom landing page, ads va PR campaign.',
      productType: 'Product Launch', status: ProjectStatus.WARNING, stage: ProjectStage.PLANNING, stageProgress: 40,
      startDate: d('2026-01-15'), endDate: d('2026-04-30'), timelineProgress: 12, clientId: client2.id,
      driveLink: 'https://drive.google.com/drive/folders/xyz-launch',
    },
  });
  const p3 = await prisma.project.create({
    data: {
      code: 'MNO-OPEN', name: 'MNO F&B - Grand Opening Campaign', description: 'Chien dich khai truong 3 chi nhanh moi cua MNO F&B tai TP.HCM. Da hoan thanh thang 12/2025.',
      productType: 'Event & Activation', status: ProjectStatus.STABLE, stage: ProjectStage.COMPLETED, stageProgress: 100,
      startDate: d('2025-11-01'), endDate: d('2025-12-31'), timelineProgress: 100, clientId: client3.id,
      driveLink: 'https://drive.google.com/drive/folders/mno-open', planLink: 'https://docs.google.com/spreadsheets/mno-open', trackingLink: 'https://datastudio.google.com/mno-report',
    },
  });
  console.log('Created 3 projects');

  // ═══════════════════════════════════════════════════════
  // PROJECT TEAMS
  // ═══════════════════════════════════════════════════════
  await prisma.projectTeam.createMany({
    data: [
      // P1 - full team
      { projectId: p1.id, userId: nvkd.id, role: UserRole.NVKD, isPrimary: true },
      { projectId: p1.id, userId: pm.id, role: UserRole.PM, isPrimary: true },
      { projectId: p1.id, userId: planner.id, role: UserRole.PLANNER, isPrimary: true },
      { projectId: p1.id, userId: account.id, role: UserRole.ACCOUNT, isPrimary: false },
      { projectId: p1.id, userId: content.id, role: UserRole.CONTENT, isPrimary: true },
      { projectId: p1.id, userId: design.id, role: UserRole.DESIGN, isPrimary: true },
      { projectId: p1.id, userId: media.id, role: UserRole.MEDIA, isPrimary: true },
      // P2 - smaller team
      { projectId: p2.id, userId: nvkd.id, role: UserRole.NVKD, isPrimary: true },
      { projectId: p2.id, userId: pm.id, role: UserRole.PM, isPrimary: true },
      { projectId: p2.id, userId: account.id, role: UserRole.ACCOUNT, isPrimary: true },
      { projectId: p2.id, userId: content.id, role: UserRole.CONTENT, isPrimary: true },
      { projectId: p2.id, userId: design.id, role: UserRole.DESIGN, isPrimary: true },
      // P3 - full team (completed project)
      { projectId: p3.id, userId: nvkd.id, role: UserRole.NVKD, isPrimary: true },
      { projectId: p3.id, userId: pm.id, role: UserRole.PM, isPrimary: true },
      { projectId: p3.id, userId: planner.id, role: UserRole.PLANNER, isPrimary: true },
      { projectId: p3.id, userId: content.id, role: UserRole.CONTENT, isPrimary: true },
      { projectId: p3.id, userId: design.id, role: UserRole.DESIGN, isPrimary: true },
      { projectId: p3.id, userId: media.id, role: UserRole.MEDIA, isPrimary: true },
    ],
  });
  console.log('Assigned teams');

  // ═══════════════════════════════════════════════════════
  // PROJECT BUDGETS
  // ═══════════════════════════════════════════════════════
  // P1: 500M, spent ~150M (APPROVED SPEND events below)
  await prisma.projectBudget.create({
    data: {
      projectId: p1.id, totalBudget: 500000000, monthlyBudget: 166666667, spentAmount: 152000000,
      fixedAdFee: 40000000, adServiceFee: 50000000, contentFee: 30000000, designFee: 18000000, mediaFee: 14000000, budgetPacing: 30.4,
    },
  });
  // P2: 300M, no spending yet
  await prisma.projectBudget.create({
    data: {
      projectId: p2.id, totalBudget: 300000000, monthlyBudget: 85714286, spentAmount: 0,
      adServiceFee: 30000000, contentFee: 20000000, designFee: 15000000, budgetPacing: 0,
    },
  });
  // P3: 200M, spent 185M (completed)
  await prisma.projectBudget.create({
    data: {
      projectId: p3.id, totalBudget: 200000000, monthlyBudget: 100000000, spentAmount: 185000000,
      fixedAdFee: 60000000, adServiceFee: 40000000, contentFee: 35000000, designFee: 25000000, mediaFee: 15000000, otherFee: 10000000, budgetPacing: 92.5,
    },
  });
  console.log('Created project budgets');

  // ═══════════════════════════════════════════════════════
  // MEDIA PLANS
  // ═══════════════════════════════════════════════════════
  // --- ADS Plans ---
  const mp1 = await prisma.mediaPlan.create({
    data: {
      projectId: p1.id, name: 'Ads Plan Thang 1/2026 - ABC Corp', type: MediaPlanType.ADS, month: 1, year: 2026, version: 2,
      status: MediaPlanStatus.ACTIVE, totalBudget: 180000000,
      startDate: d('2026-01-01'), endDate: d('2026-01-31'), notes: 'Focus Facebook Ads + Google Search. Target CPL < 50K.',
      createdById: planner.id,
    },
  });
  const mp2 = await prisma.mediaPlan.create({
    data: {
      projectId: p2.id, name: 'Ads Plan Pre-Launch - XYZ Tech', type: MediaPlanType.ADS, month: 2, year: 2026, version: 1,
      status: MediaPlanStatus.DRAFT, totalBudget: 100000000,
      startDate: d('2026-02-01'), endDate: d('2026-02-28'), notes: 'Teaser campaign truoc launch. Awareness-focused.',
      createdById: planner.id,
    },
  });
  const mp3 = await prisma.mediaPlan.create({
    data: {
      projectId: p3.id, name: 'Ads Plan Grand Opening - MNO', type: MediaPlanType.ADS, month: 12, year: 2025, version: 3,
      status: MediaPlanStatus.COMPLETED, totalBudget: 120000000,
      startDate: d('2025-12-01'), endDate: d('2025-12-31'), notes: 'Push manh Facebook + TikTok cho khai truong.',
      createdById: planner.id,
    },
  });

  // --- DESIGN Plans ---
  const mpDesign1 = await prisma.mediaPlan.create({
    data: {
      projectId: p1.id, name: 'Design Plan Thang 1/2026 - ABC Corp', type: MediaPlanType.DESIGN, month: 1, year: 2026, version: 1,
      status: MediaPlanStatus.ACTIVE, totalBudget: 35000000,
      startDate: d('2026-01-01'), endDate: d('2026-01-31'), notes: 'Thiet ke creative assets cho ads + social.',
      createdById: design.id,
    },
  });
  const mpDesign2 = await prisma.mediaPlan.create({
    data: {
      projectId: p2.id, name: 'Design Plan Pre-Launch - XYZ Tech', type: MediaPlanType.DESIGN, month: 2, year: 2026, version: 1,
      status: MediaPlanStatus.DRAFT, totalBudget: 25000000,
      startDate: d('2026-02-01'), endDate: d('2026-02-28'), notes: 'Thiet ke landing page, banner, KV cho launch.',
      createdById: design.id,
    },
  });
  const mpDesign3 = await prisma.mediaPlan.create({
    data: {
      projectId: p3.id, name: 'Design Plan Grand Opening - MNO', type: MediaPlanType.DESIGN, month: 12, year: 2025, version: 2,
      status: MediaPlanStatus.COMPLETED, totalBudget: 20000000,
      startDate: d('2025-12-01'), endDate: d('2025-12-31'), notes: 'Thiet ke full bo visual khai truong.',
      createdById: design.id,
    },
  });

  // --- CONTENT Plans ---
  const mpContent1 = await prisma.mediaPlan.create({
    data: {
      projectId: p1.id, name: 'Content Plan Thang 1/2026 - ABC Corp', type: MediaPlanType.CONTENT, month: 1, year: 2026, version: 1,
      status: MediaPlanStatus.ACTIVE, totalBudget: 20000000,
      startDate: d('2026-01-01'), endDate: d('2026-01-31'), notes: 'Content calendar thang 1: 20 bai FB + 10 bai Blog.',
      createdById: content.id,
    },
  });
  const mpContent2 = await prisma.mediaPlan.create({
    data: {
      projectId: p2.id, name: 'Content Plan Pre-Launch - XYZ Tech', type: MediaPlanType.CONTENT, month: 2, year: 2026, version: 1,
      status: MediaPlanStatus.DRAFT, totalBudget: 15000000,
      startDate: d('2026-02-01'), endDate: d('2026-02-28'), notes: 'Content teaser truoc launch: blog + social posts.',
      createdById: content.id,
    },
  });
  const mpContent3 = await prisma.mediaPlan.create({
    data: {
      projectId: p3.id, name: 'Content Plan Grand Opening - MNO', type: MediaPlanType.CONTENT, month: 12, year: 2025, version: 1,
      status: MediaPlanStatus.COMPLETED, totalBudget: 18000000,
      startDate: d('2025-12-01'), endDate: d('2025-12-31'), notes: 'Content khai truong: PR articles, social posts, video scripts.',
      createdById: content.id,
    },
  });

  // --- 2nd DESIGN Plans (each project gets a second one) ---
  const mpDesign1b = await prisma.mediaPlan.create({
    data: {
      projectId: p1.id, name: 'Design Plan Thang 2/2026 - ABC Corp', type: MediaPlanType.DESIGN, month: 2, year: 2026, version: 1,
      status: MediaPlanStatus.PENDING_APPROVAL, totalBudget: 42000000,
      startDate: d('2026-02-01'), endDate: d('2026-02-28'), notes: 'Creative assets cho Tet campaign + Valentine campaign. 5 kenh, 40+ san pham.',
      createdById: design.id,
    },
  });
  const mpDesign2b = await prisma.mediaPlan.create({
    data: {
      projectId: p2.id, name: 'Design Plan Launch Phase 2 - XYZ Tech', type: MediaPlanType.DESIGN, month: 3, year: 2026, version: 1,
      status: MediaPlanStatus.PENDING_APPROVAL, totalBudget: 38000000,
      startDate: d('2026-03-01'), endDate: d('2026-03-31'), notes: 'Phase 2 launch assets: email templates, social ads, product screenshots, pitch deck.',
      createdById: design.id,
    },
  });
  const mpDesign3b = await prisma.mediaPlan.create({
    data: {
      projectId: p3.id, name: 'Design Plan Tet Promo - MNO', type: MediaPlanType.DESIGN, month: 11, year: 2025, version: 1,
      status: MediaPlanStatus.COMPLETED, totalBudget: 28000000,
      startDate: d('2025-11-01'), endDate: d('2025-11-30'), notes: 'Bo thiet ke Tet promo + in an menu moi + standee + voucher card.',
      createdById: design.id,
    },
  });

  // --- 2nd CONTENT Plans ---
  const mpContent1b = await prisma.mediaPlan.create({
    data: {
      projectId: p1.id, name: 'Content Plan Thang 2/2026 - ABC Corp', type: MediaPlanType.CONTENT, month: 2, year: 2026, version: 1,
      status: MediaPlanStatus.DRAFT, totalBudget: 28000000,
      startDate: d('2026-02-01'), endDate: d('2026-02-28'), notes: 'Content Tet + Valentine: 30 bai FB, 8 blog, 12 TikTok, 4 email, 3 PR.',
      createdById: content.id,
    },
  });
  const mpContent2b = await prisma.mediaPlan.create({
    data: {
      projectId: p2.id, name: 'Content Plan Launch Phase 2 - XYZ Tech', type: MediaPlanType.CONTENT, month: 3, year: 2026, version: 1,
      status: MediaPlanStatus.PENDING_APPROVAL, totalBudget: 22000000,
      startDate: d('2026-03-01'), endDate: d('2026-03-31'), notes: 'Launch content: case studies, product tutorials, demo videos, email drip.',
      createdById: content.id,
    },
  });
  const mpContent3b = await prisma.mediaPlan.create({
    data: {
      projectId: p3.id, name: 'Content Plan Pre-Opening - MNO', type: MediaPlanType.CONTENT, month: 11, year: 2025, version: 1,
      status: MediaPlanStatus.COMPLETED, totalBudget: 16000000,
      startDate: d('2025-11-01'), endDate: d('2025-11-30'), notes: 'Content truoc khai truong: teaser social, KOL scripts, press releases, menu shoots.',
      createdById: content.id,
    },
  });

  // Media Plan Items
  await prisma.mediaPlanItem.createMany({
    data: [
      // === ADS Plan Items ===
      // MP1 items (Ads)
      { mediaPlanId: mp1.id, channel: 'facebook', campaignType: 'conversions', objective: 'leads', budget: 80000000, startDate: d('2026-01-01'), endDate: d('2026-01-31'), targetReach: 500000, targetClicks: 15000, targetLeads: 300, targetCPL: 45000, targetCPC: 3500, targetROAS: 3.5, status: 'active', orderIndex: 0 },
      { mediaPlanId: mp1.id, channel: 'google', campaignType: 'traffic', objective: 'leads', budget: 60000000, startDate: d('2026-01-01'), endDate: d('2026-01-31'), targetReach: 200000, targetClicks: 10000, targetLeads: 200, targetCPL: 50000, targetCPC: 5000, targetROAS: 4.0, status: 'active', orderIndex: 1 },
      { mediaPlanId: mp1.id, channel: 'google', campaignType: 'awareness', objective: 'brand_awareness', budget: 40000000, startDate: d('2026-01-10'), endDate: d('2026-01-31'), targetReach: 1000000, targetClicks: 8000, status: 'active', orderIndex: 2 },
      // MP2 items (Ads)
      { mediaPlanId: mp2.id, channel: 'facebook', campaignType: 'awareness', objective: 'brand_awareness', budget: 50000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 800000, targetClicks: 20000, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mp2.id, channel: 'google', campaignType: 'traffic', objective: 'traffic', budget: 30000000, startDate: d('2026-02-10'), endDate: d('2026-02-28'), targetReach: 150000, targetClicks: 8000, targetCPC: 3000, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mp2.id, channel: 'linkedin', campaignType: 'leads', objective: 'leads', budget: 20000000, startDate: d('2026-02-15'), endDate: d('2026-02-28'), targetReach: 50000, targetLeads: 100, targetCPL: 200000, status: 'planned', orderIndex: 2 },
      // MP3 items (Ads - completed)
      { mediaPlanId: mp3.id, channel: 'facebook', campaignType: 'conversions', objective: 'sales', budget: 60000000, startDate: d('2025-12-01'), endDate: d('2025-12-31'), targetReach: 1000000, targetClicks: 30000, status: 'completed', orderIndex: 0 },
      { mediaPlanId: mp3.id, channel: 'tiktok', campaignType: 'video_views', objective: 'brand_awareness', budget: 40000000, startDate: d('2025-12-05'), endDate: d('2025-12-31'), targetReach: 2000000, targetClicks: 50000, status: 'completed', orderIndex: 1 },
      { mediaPlanId: mp3.id, channel: 'google', campaignType: 'awareness', objective: 'reach', budget: 20000000, startDate: d('2025-12-10'), endDate: d('2025-12-31'), targetReach: 300000, targetClicks: 5000, status: 'completed', orderIndex: 2 },

      // === DESIGN Plan Items (targetReach=SL sản phẩm, targetClicks=Revisions, targetLeads=Ngày HT) ===
      // Design P1 - Thang 1 (5 items)
      { mediaPlanId: mpDesign1.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 10000000, startDate: d('2026-01-01'), endDate: d('2026-01-31'), targetReach: 20, targetClicks: 2, targetLeads: 14, status: 'active', orderIndex: 0 },
      { mediaPlanId: mpDesign1.id, channel: 'display_ads', campaignType: 'banner', objective: 'campaign_assets', budget: 8000000, startDate: d('2026-01-01'), endDate: d('2026-01-20'), targetReach: 8, targetClicks: 3, targetLeads: 10, status: 'active', orderIndex: 1 },
      { mediaPlanId: mpDesign1.id, channel: 'video', campaignType: 'motion_graphics', objective: 'campaign_assets', budget: 9000000, startDate: d('2026-01-10'), endDate: d('2026-01-31'), targetReach: 5, targetClicks: 2, targetLeads: 21, status: 'active', orderIndex: 2 },
      { mediaPlanId: mpDesign1.id, channel: 'brand', campaignType: 'key_visual', objective: 'brand_refresh', budget: 5000000, startDate: d('2026-01-05'), endDate: d('2026-01-15'), targetReach: 3, targetClicks: 4, targetLeads: 7, status: 'active', orderIndex: 3 },
      { mediaPlanId: mpDesign1.id, channel: 'website', campaignType: 'ui_design', objective: 'campaign_assets', budget: 3000000, startDate: d('2026-01-15'), endDate: d('2026-01-28'), targetReach: 2, targetClicks: 3, targetLeads: 10, status: 'active', orderIndex: 4 },
      // Design P1b - Thang 2 (5 items, Tet + Valentine)
      { mediaPlanId: mpDesign1b.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 12000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 30, targetClicks: 2, targetLeads: 14, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpDesign1b.id, channel: 'display_ads', campaignType: 'banner', objective: 'campaign_assets', budget: 8000000, startDate: d('2026-02-01'), endDate: d('2026-02-14'), targetReach: 12, targetClicks: 3, targetLeads: 10, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpDesign1b.id, channel: 'video', campaignType: 'motion_graphics', objective: 'campaign_assets', budget: 10000000, startDate: d('2026-02-05'), endDate: d('2026-02-25'), targetReach: 6, targetClicks: 2, targetLeads: 18, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpDesign1b.id, channel: 'print', campaignType: 'print_material', objective: 'campaign_assets', budget: 7000000, startDate: d('2026-02-01'), endDate: d('2026-02-10'), targetReach: 4, targetClicks: 1, targetLeads: 7, status: 'planned', orderIndex: 3 },
      { mediaPlanId: mpDesign1b.id, channel: 'brand', campaignType: 'key_visual', objective: 'brand_refresh', budget: 5000000, startDate: d('2026-02-01'), endDate: d('2026-02-08'), targetReach: 2, targetClicks: 3, targetLeads: 5, status: 'planned', orderIndex: 4 },
      // Design P2 - Pre-Launch (4 items)
      { mediaPlanId: mpDesign2.id, channel: 'website', campaignType: 'ui_design', objective: 'campaign_assets', budget: 12000000, startDate: d('2026-02-01'), endDate: d('2026-02-20'), targetReach: 1, targetClicks: 4, targetLeads: 15, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpDesign2.id, channel: 'display_ads', campaignType: 'key_visual', objective: 'brand_refresh', budget: 5000000, startDate: d('2026-02-05'), endDate: d('2026-02-18'), targetReach: 3, targetClicks: 3, targetLeads: 10, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpDesign2.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 4000000, startDate: d('2026-02-10'), endDate: d('2026-02-28'), targetReach: 15, targetClicks: 2, targetLeads: 12, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpDesign2.id, channel: 'video', campaignType: 'video_production', objective: 'campaign_assets', budget: 4000000, startDate: d('2026-02-12'), endDate: d('2026-02-28'), targetReach: 2, targetClicks: 2, targetLeads: 14, status: 'planned', orderIndex: 3 },
      // Design P2b - Launch Phase 2 (5 items)
      { mediaPlanId: mpDesign2b.id, channel: 'display_ads', campaignType: 'banner', objective: 'campaign_assets', budget: 8000000, startDate: d('2026-03-01'), endDate: d('2026-03-15'), targetReach: 10, targetClicks: 2, targetLeads: 10, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpDesign2b.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 8000000, startDate: d('2026-03-01'), endDate: d('2026-03-31'), targetReach: 24, targetClicks: 2, targetLeads: 21, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpDesign2b.id, channel: 'website', campaignType: 'ui_design', objective: 'campaign_assets', budget: 6000000, startDate: d('2026-03-05'), endDate: d('2026-03-20'), targetReach: 5, targetClicks: 3, targetLeads: 12, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpDesign2b.id, channel: 'video', campaignType: 'motion_graphics', objective: 'campaign_assets', budget: 10000000, startDate: d('2026-03-01'), endDate: d('2026-03-25'), targetReach: 4, targetClicks: 2, targetLeads: 20, status: 'planned', orderIndex: 3 },
      { mediaPlanId: mpDesign2b.id, channel: 'brand', campaignType: 'brand_guidelines', objective: 'brand_refresh', budget: 6000000, startDate: d('2026-03-10'), endDate: d('2026-03-31'), targetReach: 1, targetClicks: 5, targetLeads: 15, status: 'planned', orderIndex: 4 },
      // Design P3 - Grand Opening (4 items)
      { mediaPlanId: mpDesign3.id, channel: 'brand', campaignType: 'brand_guidelines', objective: 'brand_refresh', budget: 6000000, startDate: d('2025-12-01'), endDate: d('2025-12-10'), targetReach: 1, targetClicks: 5, targetLeads: 7, status: 'completed', orderIndex: 0 },
      { mediaPlanId: mpDesign3.id, channel: 'print', campaignType: 'print_material', objective: 'campaign_assets', budget: 5000000, startDate: d('2025-12-05'), endDate: d('2025-12-20'), targetReach: 6, targetClicks: 2, targetLeads: 12, status: 'completed', orderIndex: 1 },
      { mediaPlanId: mpDesign3.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 5000000, startDate: d('2025-12-01'), endDate: d('2025-12-31'), targetReach: 15, targetClicks: 2, targetLeads: 20, status: 'completed', orderIndex: 2 },
      { mediaPlanId: mpDesign3.id, channel: 'video', campaignType: 'video_production', objective: 'campaign_assets', budget: 4000000, startDate: d('2025-12-08'), endDate: d('2025-12-28'), targetReach: 3, targetClicks: 3, targetLeads: 15, status: 'completed', orderIndex: 3 },
      // Design P3b - Tet Promo (5 items)
      { mediaPlanId: mpDesign3b.id, channel: 'social_media', campaignType: 'post_design', objective: 'quantity', budget: 7000000, startDate: d('2025-11-01'), endDate: d('2025-11-30'), targetReach: 25, targetClicks: 2, targetLeads: 20, status: 'completed', orderIndex: 0 },
      { mediaPlanId: mpDesign3b.id, channel: 'print', campaignType: 'print_material', objective: 'campaign_assets', budget: 6000000, startDate: d('2025-11-01'), endDate: d('2025-11-15'), targetReach: 8, targetClicks: 1, targetLeads: 10, status: 'completed', orderIndex: 1 },
      { mediaPlanId: mpDesign3b.id, channel: 'brand', campaignType: 'key_visual', objective: 'brand_refresh', budget: 5000000, startDate: d('2025-11-01'), endDate: d('2025-11-10'), targetReach: 2, targetClicks: 4, targetLeads: 7, status: 'completed', orderIndex: 2 },
      { mediaPlanId: mpDesign3b.id, channel: 'display_ads', campaignType: 'banner', objective: 'campaign_assets', budget: 5000000, startDate: d('2025-11-10'), endDate: d('2025-11-25'), targetReach: 10, targetClicks: 2, targetLeads: 12, status: 'completed', orderIndex: 3 },
      { mediaPlanId: mpDesign3b.id, channel: 'video', campaignType: 'motion_graphics', objective: 'campaign_assets', budget: 5000000, startDate: d('2025-11-05'), endDate: d('2025-11-28'), targetReach: 3, targetClicks: 2, targetLeads: 18, status: 'completed', orderIndex: 4 },

      // === CONTENT Plan Items (targetReach=SL bài, targetClicks=Views, targetLeads=Engagement, targetCPL=Tần suất bài/tuần) ===
      // Content P1 - Thang 1 (5 items)
      { mediaPlanId: mpContent1.id, channel: 'facebook', campaignType: 'social_post', objective: 'quantity', budget: 6000000, startDate: d('2026-01-01'), endDate: d('2026-01-31'), targetReach: 20, targetClicks: 50000, targetLeads: 5000, targetCPL: 5, status: 'active', orderIndex: 0 },
      { mediaPlanId: mpContent1.id, channel: 'blog', campaignType: 'blog_article', objective: 'seo_ranking', budget: 5000000, startDate: d('2026-01-01'), endDate: d('2026-01-31'), targetReach: 10, targetClicks: 30000, targetLeads: 2000, targetCPL: 3, status: 'active', orderIndex: 1 },
      { mediaPlanId: mpContent1.id, channel: 'tiktok', campaignType: 'video_script', objective: 'engagement', budget: 4000000, startDate: d('2026-01-10'), endDate: d('2026-01-31'), targetReach: 8, targetClicks: 100000, targetLeads: 15000, targetCPL: 2, status: 'active', orderIndex: 2 },
      { mediaPlanId: mpContent1.id, channel: 'instagram', campaignType: 'story_script', objective: 'engagement', budget: 3000000, startDate: d('2026-01-05'), endDate: d('2026-01-31'), targetReach: 12, targetClicks: 40000, targetLeads: 6000, targetCPL: 3, status: 'active', orderIndex: 3 },
      { mediaPlanId: mpContent1.id, channel: 'email', campaignType: 'newsletter', objective: 'conversion', budget: 2000000, startDate: d('2026-01-15'), endDate: d('2026-01-31'), targetReach: 4, targetClicks: 8000, targetLeads: 800, targetCPL: 2, status: 'active', orderIndex: 4 },
      // Content P1b - Thang 2 (5 items, Tet + Valentine)
      { mediaPlanId: mpContent1b.id, channel: 'facebook', campaignType: 'social_post', objective: 'quantity', budget: 8000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 30, targetClicks: 80000, targetLeads: 8000, targetCPL: 7, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpContent1b.id, channel: 'tiktok', campaignType: 'video_script', objective: 'engagement', budget: 6000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 12, targetClicks: 200000, targetLeads: 25000, targetCPL: 3, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpContent1b.id, channel: 'blog', campaignType: 'blog_article', objective: 'seo_ranking', budget: 5000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 8, targetClicks: 25000, targetLeads: 1500, targetCPL: 2, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpContent1b.id, channel: 'email', campaignType: 'newsletter', objective: 'conversion', budget: 4000000, startDate: d('2026-02-10'), endDate: d('2026-02-28'), targetReach: 4, targetClicks: 12000, targetLeads: 1200, targetCPL: 2, status: 'planned', orderIndex: 3 },
      { mediaPlanId: mpContent1b.id, channel: 'pr', campaignType: 'pr_article', objective: 'quantity', budget: 5000000, startDate: d('2026-02-01'), endDate: d('2026-02-14'), targetReach: 3, targetClicks: 50000, targetLeads: 2000, targetCPL: 1, status: 'planned', orderIndex: 4 },
      // Content P2 - Pre-Launch (4 items)
      { mediaPlanId: mpContent2.id, channel: 'blog', campaignType: 'blog_article', objective: 'seo_ranking', budget: 5000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 8, targetClicks: 20000, targetLeads: 1500, targetCPL: 2, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpContent2.id, channel: 'facebook', campaignType: 'social_post', objective: 'engagement', budget: 4000000, startDate: d('2026-02-01'), endDate: d('2026-02-28'), targetReach: 15, targetClicks: 40000, targetLeads: 4000, targetCPL: 4, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpContent2.id, channel: 'email', campaignType: 'newsletter', objective: 'conversion', budget: 3000000, startDate: d('2026-02-15'), endDate: d('2026-02-28'), targetReach: 4, targetClicks: 5000, targetLeads: 500, targetCPL: 2, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpContent2.id, channel: 'ads_copy', campaignType: 'ad_copy', objective: 'conversion', budget: 3000000, startDate: d('2026-02-05'), endDate: d('2026-02-25'), targetReach: 20, targetClicks: 15000, targetLeads: 2000, targetCPL: 5, status: 'planned', orderIndex: 3 },
      // Content P2b - Launch Phase 2 (5 items)
      { mediaPlanId: mpContent2b.id, channel: 'blog', campaignType: 'blog_article', objective: 'seo_ranking', budget: 5000000, startDate: d('2026-03-01'), endDate: d('2026-03-31'), targetReach: 6, targetClicks: 25000, targetLeads: 2000, targetCPL: 2, status: 'planned', orderIndex: 0 },
      { mediaPlanId: mpContent2b.id, channel: 'facebook', campaignType: 'social_post', objective: 'engagement', budget: 5000000, startDate: d('2026-03-01'), endDate: d('2026-03-31'), targetReach: 20, targetClicks: 60000, targetLeads: 6000, targetCPL: 5, status: 'planned', orderIndex: 1 },
      { mediaPlanId: mpContent2b.id, channel: 'email', campaignType: 'newsletter', objective: 'conversion', budget: 4000000, startDate: d('2026-03-01'), endDate: d('2026-03-31'), targetReach: 8, targetClicks: 10000, targetLeads: 1200, targetCPL: 2, status: 'planned', orderIndex: 2 },
      { mediaPlanId: mpContent2b.id, channel: 'tiktok', campaignType: 'video_script', objective: 'engagement', budget: 4000000, startDate: d('2026-03-05'), endDate: d('2026-03-31'), targetReach: 8, targetClicks: 120000, targetLeads: 12000, targetCPL: 2, status: 'planned', orderIndex: 3 },
      { mediaPlanId: mpContent2b.id, channel: 'pr', campaignType: 'pr_article', objective: 'quantity', budget: 4000000, startDate: d('2026-03-10'), endDate: d('2026-03-25'), targetReach: 5, targetClicks: 80000, targetLeads: 3000, targetCPL: 1, status: 'planned', orderIndex: 4 },
      // Content P3 - Grand Opening (4 items)
      { mediaPlanId: mpContent3.id, channel: 'pr', campaignType: 'pr_article', objective: 'quantity', budget: 6000000, startDate: d('2025-12-01'), endDate: d('2025-12-20'), targetReach: 5, targetClicks: 80000, targetLeads: 3000, targetCPL: 2, status: 'completed', orderIndex: 0 },
      { mediaPlanId: mpContent3.id, channel: 'facebook', campaignType: 'social_post', objective: 'engagement', budget: 5000000, startDate: d('2025-12-01'), endDate: d('2025-12-31'), targetReach: 25, targetClicks: 150000, targetLeads: 20000, targetCPL: 7, status: 'completed', orderIndex: 1 },
      { mediaPlanId: mpContent3.id, channel: 'tiktok', campaignType: 'video_script', objective: 'engagement', budget: 4000000, startDate: d('2025-12-05'), endDate: d('2025-12-31'), targetReach: 10, targetClicks: 500000, targetLeads: 50000, targetCPL: 3, status: 'completed', orderIndex: 2 },
      { mediaPlanId: mpContent3.id, channel: 'instagram', campaignType: 'story_script', objective: 'engagement', budget: 3000000, startDate: d('2025-12-01'), endDate: d('2025-12-31'), targetReach: 15, targetClicks: 60000, targetLeads: 8000, targetCPL: 4, status: 'completed', orderIndex: 3 },
      // Content P3b - Pre-Opening (5 items)
      { mediaPlanId: mpContent3b.id, channel: 'facebook', campaignType: 'social_post', objective: 'engagement', budget: 4000000, startDate: d('2025-11-01'), endDate: d('2025-11-30'), targetReach: 20, targetClicks: 60000, targetLeads: 8000, targetCPL: 5, status: 'completed', orderIndex: 0 },
      { mediaPlanId: mpContent3b.id, channel: 'tiktok', campaignType: 'video_script', objective: 'engagement', budget: 3000000, startDate: d('2025-11-05'), endDate: d('2025-11-30'), targetReach: 6, targetClicks: 300000, targetLeads: 30000, targetCPL: 2, status: 'completed', orderIndex: 1 },
      { mediaPlanId: mpContent3b.id, channel: 'pr', campaignType: 'pr_article', objective: 'quantity', budget: 4000000, startDate: d('2025-11-01'), endDate: d('2025-11-20'), targetReach: 4, targetClicks: 50000, targetLeads: 2000, targetCPL: 1, status: 'completed', orderIndex: 2 },
      { mediaPlanId: mpContent3b.id, channel: 'blog', campaignType: 'blog_article', objective: 'seo_ranking', budget: 3000000, startDate: d('2025-11-01'), endDate: d('2025-11-25'), targetReach: 5, targetClicks: 15000, targetLeads: 1000, targetCPL: 1, status: 'completed', orderIndex: 3 },
      { mediaPlanId: mpContent3b.id, channel: 'email', campaignType: 'newsletter', objective: 'conversion', budget: 2000000, startDate: d('2025-11-15'), endDate: d('2025-11-30'), targetReach: 3, targetClicks: 6000, targetLeads: 600, targetCPL: 1, status: 'completed', orderIndex: 4 },
    ],
  });
  console.log('Created media plans + items (ADS, DESIGN, CONTENT)');

  // ═══════════════════════════════════════════════════════
  // BUDGET EVENTS
  // ═══════════════════════════════════════════════════════
  await prisma.budgetEvent.createMany({
    data: [
      // === P1 Budget Events ===
      // ALLOC events
      { projectId: p1.id, amount: 500000000, type: BudgetEventType.ALLOC, category: BudgetEventCategory.OTHER, status: BudgetEventStatus.APPROVED, note: 'Phan bo ngan sach Q1/2026', createdById: nvkd.id, createdAt: d('2025-12-20') },
      // SPEND APPROVED - FIXED_AD
      { projectId: p1.id, amount: 40000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.FIXED_AD, status: BudgetEventStatus.APPROVED, note: 'Phi quang cao co dinh thang 1 - Facebook', createdById: media.id, mediaPlanId: mp1.id, stage: 'ONGOING', createdAt: d('2026-01-05') },
      // SPEND APPROVED - AD_SERVICE
      { projectId: p1.id, amount: 25000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.AD_SERVICE, status: BudgetEventStatus.APPROVED, note: 'Phi dich vu ads agency - dot 1', createdById: media.id, stage: 'ONGOING', createdAt: d('2026-01-08') },
      { projectId: p1.id, amount: 22000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.AD_SERVICE, status: BudgetEventStatus.APPROVED, note: 'Phi dich vu ads agency - dot 2', createdById: media.id, stage: 'ONGOING', createdAt: d('2026-01-20') },
      // SPEND APPROVED - CONTENT
      { projectId: p1.id, amount: 15000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.CONTENT, status: BudgetEventStatus.APPROVED, note: 'Phi san xuat content thang 1 - dot 1', createdById: content.id, stage: 'ONGOING', createdAt: d('2026-01-10') },
      { projectId: p1.id, amount: 12000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.CONTENT, status: BudgetEventStatus.APPROVED, note: 'Phi san xuat content thang 1 - dot 2', createdById: content.id, stage: 'ONGOING', createdAt: d('2026-01-22') },
      // SPEND APPROVED - DESIGN
      { projectId: p1.id, amount: 18000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.DESIGN, status: BudgetEventStatus.APPROVED, note: 'Phi thiet ke creative assets thang 1', createdById: design.id, stage: 'ONGOING', createdAt: d('2026-01-07') },
      // SPEND APPROVED - MEDIA
      { projectId: p1.id, amount: 14000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.MEDIA, status: BudgetEventStatus.APPROVED, note: 'Phi booking media placements', createdById: media.id, stage: 'ONGOING', createdAt: d('2026-01-12') },
      // SPEND PAID (subset of approved)
      { projectId: p1.id, amount: 6000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.OTHER, status: BudgetEventStatus.PAID, note: 'Phi tool SaaS (analytics, scheduling)', createdById: pm.id, stage: 'ONGOING', createdAt: d('2026-01-03') },
      // SPEND PENDING
      { projectId: p1.id, amount: 35000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.FIXED_AD, status: BudgetEventStatus.PENDING, note: 'De xuat phi ads thang 2 - Facebook', createdById: media.id, mediaPlanId: mp1.id, stage: 'ONGOING', createdAt: d('2026-01-25') },
      { projectId: p1.id, amount: 8000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.CONTENT, status: BudgetEventStatus.PENDING, note: 'De xuat phi video content thang 2', createdById: content.id, stage: 'ONGOING', createdAt: d('2026-01-26') },
      // SPEND REJECTED
      { projectId: p1.id, amount: 50000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.MEDIA, status: BudgetEventStatus.REJECTED, note: 'De xuat booking KOL - bi tu choi do vuot ngan sach', createdById: media.id, createdAt: d('2026-01-15') },

      // === P2 Budget Events ===
      { projectId: p2.id, amount: 300000000, type: BudgetEventType.ALLOC, category: BudgetEventCategory.OTHER, status: BudgetEventStatus.APPROVED, note: 'Phan bo ngan sach Product Launch', createdById: nvkd.id, createdAt: d('2026-01-10') },
      { projectId: p2.id, amount: 15000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.DESIGN, status: BudgetEventStatus.PENDING, note: 'De xuat phi thiet ke landing page', createdById: design.id, stage: 'PLANNING', createdAt: d('2026-01-20') },
      { projectId: p2.id, amount: 10000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.CONTENT, status: BudgetEventStatus.PENDING, note: 'De xuat phi copywriting cho launch', createdById: content.id, stage: 'PLANNING', createdAt: d('2026-01-22') },

      // === P3 Budget Events (completed - all PAID) ===
      { projectId: p3.id, amount: 200000000, type: BudgetEventType.ALLOC, category: BudgetEventCategory.OTHER, status: BudgetEventStatus.APPROVED, note: 'Phan bo ngan sach Grand Opening', createdById: nvkd.id, createdAt: d('2025-10-25') },
      { projectId: p3.id, amount: 60000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.FIXED_AD, status: BudgetEventStatus.PAID, note: 'Phi ads Facebook - Grand Opening', createdById: media.id, mediaPlanId: mp3.id, stage: 'ONGOING', createdAt: d('2025-12-05') },
      { projectId: p3.id, amount: 40000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.AD_SERVICE, status: BudgetEventStatus.PAID, note: 'Phi dich vu ads agency', createdById: media.id, stage: 'ONGOING', createdAt: d('2025-12-10') },
      { projectId: p3.id, amount: 35000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.CONTENT, status: BudgetEventStatus.PAID, note: 'Phi content video + photo shoot', createdById: content.id, stage: 'ONGOING', createdAt: d('2025-12-08') },
      { projectId: p3.id, amount: 25000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.DESIGN, status: BudgetEventStatus.PAID, note: 'Phi thiet ke quang cao + in an', createdById: design.id, stage: 'ONGOING', createdAt: d('2025-12-03') },
      { projectId: p3.id, amount: 15000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.MEDIA, status: BudgetEventStatus.PAID, note: 'Phi booking offline media', createdById: media.id, stage: 'ONGOING', createdAt: d('2025-12-15') },
      { projectId: p3.id, amount: 10000000, type: BudgetEventType.SPEND, category: BudgetEventCategory.OTHER, status: BudgetEventStatus.PAID, note: 'Phi to chuc su kien khai truong', createdById: pm.id, stage: 'ONGOING', createdAt: d('2025-12-20') },
    ],
  });
  console.log('Created budget events');

  // ═══════════════════════════════════════════════════════
  // ADS REPORTS - daily data for P1 and P3
  // ═══════════════════════════════════════════════════════
  const adsReports: Array<{
    projectId: string; period: AdsReportPeriod; reportDate: Date;
    impressions: number; clicks: number; ctr: number; cpc: number; cpm: number; cpa: number;
    conversions: number; roas: number; adSpend: number; platform: AdsPlatform;
    campaignName: string; source: AdsReportSource; createdById: string; createdAt: Date;
  }> = [];

  // P1: Daily Facebook ads Jan 1-28
  for (let day = 1; day <= 28; day++) {
    const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
    const imp = 8000 + Math.floor(Math.random() * 12000); // 8K-20K
    const clicks = Math.floor(imp * (0.018 + Math.random() * 0.025)); // CTR 1.8-4.3%
    const ctr = parseFloat(((clicks / imp) * 100).toFixed(2));
    const cpc = 2500 + Math.floor(Math.random() * 2000); // 2500-4500 VND
    const adSpend = clicks * cpc;
    const cpm = parseFloat(((adSpend / imp) * 1000).toFixed(2));
    const conversions = Math.floor(clicks * (0.03 + Math.random() * 0.04)); // 3-7% conversion
    const cpa = conversions > 0 ? Math.round(adSpend / conversions) : 0;
    const roas = conversions > 0 ? parseFloat((conversions * 150000 / adSpend).toFixed(2)) : 0; // avg order 150K

    adsReports.push({
      projectId: p1.id, period: AdsReportPeriod.DAILY, reportDate: d(dateStr),
      impressions: imp, clicks, ctr, cpc, cpm, cpa, conversions, roas, adSpend,
      platform: AdsPlatform.FACEBOOK, campaignName: 'ABC Q1 - Lead Gen', source: AdsReportSource.MANUAL, createdById: media.id, createdAt: d(dateStr),
    });
  }

  // P1: Daily Google ads Jan 5-28
  for (let day = 5; day <= 28; day++) {
    const dateStr = `2026-01-${String(day).padStart(2, '0')}`;
    const imp = 3000 + Math.floor(Math.random() * 5000); // 3K-8K
    const clicks = Math.floor(imp * (0.04 + Math.random() * 0.04)); // CTR 4-8% (search)
    const ctr = parseFloat(((clicks / imp) * 100).toFixed(2));
    const cpc = 4000 + Math.floor(Math.random() * 3000); // 4000-7000 VND
    const adSpend = clicks * cpc;
    const cpm = parseFloat(((adSpend / imp) * 1000).toFixed(2));
    const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.05)); // 5-10% conversion
    const cpa = conversions > 0 ? Math.round(adSpend / conversions) : 0;
    const roas = conversions > 0 ? parseFloat((conversions * 200000 / adSpend).toFixed(2)) : 0;

    adsReports.push({
      projectId: p1.id, period: AdsReportPeriod.DAILY, reportDate: d(dateStr),
      impressions: imp, clicks, ctr, cpc, cpm, cpa, conversions, roas, adSpend,
      platform: AdsPlatform.GOOGLE, campaignName: 'ABC Q1 - Search Leads', source: AdsReportSource.MANUAL, createdById: media.id, createdAt: d(dateStr),
    });
  }

  // P3: Daily Facebook ads Dec 1-31 (completed)
  for (let day = 1; day <= 31; day++) {
    const dateStr = `2025-12-${String(day).padStart(2, '0')}`;
    const imp = 15000 + Math.floor(Math.random() * 20000);
    const clicks = Math.floor(imp * (0.025 + Math.random() * 0.03));
    const ctr = parseFloat(((clicks / imp) * 100).toFixed(2));
    const cpc = 1800 + Math.floor(Math.random() * 1200);
    const adSpend = clicks * cpc;
    const cpm = parseFloat(((adSpend / imp) * 1000).toFixed(2));
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03));
    const cpa = conversions > 0 ? Math.round(adSpend / conversions) : 0;
    const roas = conversions > 0 ? parseFloat((conversions * 100000 / adSpend).toFixed(2)) : 0;

    adsReports.push({
      projectId: p3.id, period: AdsReportPeriod.DAILY, reportDate: d(dateStr),
      impressions: imp, clicks, ctr, cpc, cpm, cpa, conversions, roas, adSpend,
      platform: AdsPlatform.FACEBOOK, campaignName: 'MNO Grand Opening - FB', source: AdsReportSource.MANUAL, createdById: media.id, createdAt: d(dateStr),
    });
  }

  // P3: Daily TikTok ads Dec 5-31
  for (let day = 5; day <= 31; day++) {
    const dateStr = `2025-12-${String(day).padStart(2, '0')}`;
    const imp = 30000 + Math.floor(Math.random() * 40000);
    const clicks = Math.floor(imp * (0.01 + Math.random() * 0.015));
    const ctr = parseFloat(((clicks / imp) * 100).toFixed(2));
    const cpc = 1200 + Math.floor(Math.random() * 800);
    const adSpend = clicks * cpc;
    const cpm = parseFloat(((adSpend / imp) * 1000).toFixed(2));
    const conversions = Math.floor(clicks * (0.015 + Math.random() * 0.02));
    const cpa = conversions > 0 ? Math.round(adSpend / conversions) : 0;
    const roas = conversions > 0 ? parseFloat((conversions * 80000 / adSpend).toFixed(2)) : 0;

    adsReports.push({
      projectId: p3.id, period: AdsReportPeriod.DAILY, reportDate: d(dateStr),
      impressions: imp, clicks, ctr, cpc, cpm, cpa, conversions, roas, adSpend,
      platform: AdsPlatform.TIKTOK, campaignName: 'MNO Grand Opening - TikTok', source: AdsReportSource.MANUAL, createdById: media.id, createdAt: d(dateStr),
    });
  }

  await prisma.adsReport.createMany({ data: adsReports });
  console.log(`Created ${adsReports.length} ads reports`);

  // ═══════════════════════════════════════════════════════
  // TASKS - P1 (10 tasks + subtasks)
  // ═══════════════════════════════════════════════════════
  const t1_1 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Lap content calendar thang 1', description: 'Len lich noi dung cho toan bo kenh social media trong thang 1/2026.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 8, actualHours: 10, deadline: d('2026-01-05'), createdById: pm.id, reviewerId: planner.id, completedAt: d('2026-01-04'), orderIndex: 0 },
  });
  const t1_2 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Thiet ke creative assets batch 1', description: 'Thiet ke 20 mau quang cao cho Facebook va Google Display.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 24, actualHours: 22, deadline: d('2026-01-12'), createdById: pm.id, reviewerId: planner.id, completedAt: d('2026-01-11'), orderIndex: 1 },
  });
  const t1_3 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Viet ad copy Facebook campaigns', description: 'Viet noi dung quang cao cho 5 ad sets tren Facebook.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, estimatedHours: 6, actualHours: 5, deadline: d('2026-01-10'), createdById: pm.id, reviewerId: content.id, completedAt: d('2026-01-09'), orderIndex: 2 },
  });
  const t1_4 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Setup Google Ads campaigns', description: 'Cai dat va toi uu cac chien dich Google Search & Display.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 12, actualHours: 14, deadline: d('2026-01-08'), createdById: pm.id, reviewerId: media.id, completedAt: d('2026-01-08'), orderIndex: 3 },
  });
  const t1_5 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Thiet ke creative assets batch 2', description: 'Thiet ke 15 mau quang cao moi dua tren A/B test results.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, estimatedHours: 20, deadline: d('2026-01-30'), createdById: pm.id, reviewerId: planner.id, startedAt: d('2026-01-20'), orderIndex: 4 },
  });
  const t1_6 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Viet blog posts SEO', description: 'Viet 4 bai blog SEO-optimized cho website ABC Corp.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, estimatedHours: 16, deadline: d('2026-02-05'), createdById: pm.id, startedAt: d('2026-01-22'), orderIndex: 5 },
  });
  const t1_7 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Bao cao performance tuan 3', description: 'Tong hop va phan tich hieu qua quang cao tuan 3 thang 1.', status: TaskStatus.REVIEW, priority: TaskPriority.MEDIUM, estimatedHours: 4, deadline: d('2026-01-27'), createdById: pm.id, reviewerId: nvkd.id, orderIndex: 6 },
  });
  const t1_8 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Chup hinh san pham dot 2', description: 'Len lich va thuc hien buoi chup hinh san pham cho content thang 2.', status: TaskStatus.TODO, priority: TaskPriority.LOW, estimatedHours: 8, deadline: d('2026-02-10'), createdById: pm.id, orderIndex: 7 },
  });
  const t1_9 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Toi uu landing page', description: 'Cap nhat landing page theo CRO audit. Cai thien form va CTA.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, estimatedHours: 12, deadline: d('2026-02-03'), createdById: pm.id, orderIndex: 8 },
  });
  const t1_10 = await prisma.task.create({
    data: { projectId: p1.id, title: 'Lap media plan thang 2', description: 'Lap ke hoach media chi tiet cho thang 2 dua tren ket qua thang 1.', status: TaskStatus.TODO, priority: TaskPriority.URGENT, estimatedHours: 10, deadline: d('2026-01-30'), createdById: pm.id, orderIndex: 9 },
  });

  // Subtasks for t1_5
  const t1_5a = await prisma.task.create({
    data: { projectId: p1.id, parentId: t1_5.id, title: 'Thiet ke 5 mau Facebook carousel', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 8, actualHours: 7, deadline: d('2026-01-25'), createdById: pm.id, completedAt: d('2026-01-24'), orderIndex: 0 },
  });
  const t1_5b = await prisma.task.create({
    data: { projectId: p1.id, parentId: t1_5.id, title: 'Thiet ke 5 mau Google Display banner', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, estimatedHours: 6, deadline: d('2026-01-28'), createdById: pm.id, startedAt: d('2026-01-25'), orderIndex: 1 },
  });
  const t1_5c = await prisma.task.create({
    data: { projectId: p1.id, parentId: t1_5.id, title: 'Thiet ke 5 mau Story/Reels', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, estimatedHours: 6, deadline: d('2026-01-30'), createdById: pm.id, orderIndex: 2 },
  });

  // P2 tasks
  const t2_1 = await prisma.task.create({
    data: { projectId: p2.id, title: 'Nghien cuu thi truong SaaS', description: 'Phan tich doi thu canh tranh va xu huong thi truong SaaS Viet Nam.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 16, actualHours: 18, deadline: d('2026-01-20'), createdById: pm.id, reviewerId: nvkd.id, completedAt: d('2026-01-19'), orderIndex: 0 },
  });
  const t2_2 = await prisma.task.create({
    data: { projectId: p2.id, title: 'Xay dung brand guidelines', description: 'Tao bo nhan dien thuong hieu cho san pham moi.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, estimatedHours: 20, deadline: d('2026-01-31'), createdById: pm.id, reviewerId: account.id, startedAt: d('2026-01-21'), orderIndex: 1 },
  });
  const t2_3 = await prisma.task.create({
    data: { projectId: p2.id, title: 'Thiet ke landing page', description: 'Wireframe va mockup cho landing page san pham.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, estimatedHours: 24, deadline: d('2026-02-07'), createdById: pm.id, orderIndex: 2 },
  });
  const t2_4 = await prisma.task.create({
    data: { projectId: p2.id, title: 'Viet content launch campaign', description: 'Chuan bi noi dung cho email, social media va PR.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, estimatedHours: 16, deadline: d('2026-02-10'), createdById: pm.id, orderIndex: 3 },
  });
  const t2_5 = await prisma.task.create({
    data: { projectId: p2.id, title: 'Setup tracking & analytics', description: 'Cai dat Google Analytics 4, Facebook Pixel, conversion tracking.', status: TaskStatus.BLOCKED, priority: TaskPriority.HIGH, estimatedHours: 8, deadline: d('2026-02-01'), createdById: pm.id, orderIndex: 4 },
  });

  // P3 tasks (all done)
  const t3_1 = await prisma.task.create({
    data: { projectId: p3.id, title: 'Thiet ke key visual khai truong', status: TaskStatus.DONE, priority: TaskPriority.URGENT, estimatedHours: 12, actualHours: 14, deadline: d('2025-11-20'), createdById: pm.id, reviewerId: nvkd.id, completedAt: d('2025-11-19'), orderIndex: 0 },
  });
  const t3_2 = await prisma.task.create({
    data: { projectId: p3.id, title: 'San xuat video quang cao 30s', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 24, actualHours: 28, deadline: d('2025-11-28'), createdById: pm.id, reviewerId: planner.id, completedAt: d('2025-11-27'), orderIndex: 1 },
  });
  const t3_3 = await prisma.task.create({
    data: { projectId: p3.id, title: 'Chay chien dich Facebook Ads', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 16, actualHours: 20, deadline: d('2025-12-31'), createdById: pm.id, completedAt: d('2025-12-31'), orderIndex: 2 },
  });
  const t3_4 = await prisma.task.create({
    data: { projectId: p3.id, title: 'Chay chien dich TikTok Ads', status: TaskStatus.DONE, priority: TaskPriority.HIGH, estimatedHours: 12, actualHours: 15, deadline: d('2025-12-31'), createdById: pm.id, completedAt: d('2025-12-31'), orderIndex: 3 },
  });
  const t3_5 = await prisma.task.create({
    data: { projectId: p3.id, title: 'Bao cao tong ket chien dich', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, estimatedHours: 8, actualHours: 6, deadline: d('2026-01-05'), createdById: pm.id, reviewerId: nvkd.id, completedAt: d('2026-01-04'), orderIndex: 4 },
  });

  // Task assignees
  await prisma.taskAssignee.createMany({
    data: [
      // P1 tasks
      { taskId: t1_1.id, userId: content.id },
      { taskId: t1_1.id, userId: planner.id },
      { taskId: t1_2.id, userId: design.id },
      { taskId: t1_3.id, userId: content.id },
      { taskId: t1_4.id, userId: media.id },
      { taskId: t1_5.id, userId: design.id },
      { taskId: t1_5a.id, userId: design.id },
      { taskId: t1_5b.id, userId: design.id },
      { taskId: t1_5c.id, userId: design.id },
      { taskId: t1_6.id, userId: content.id },
      { taskId: t1_7.id, userId: media.id },
      { taskId: t1_7.id, userId: planner.id },
      { taskId: t1_8.id, userId: content.id },
      { taskId: t1_8.id, userId: design.id },
      { taskId: t1_9.id, userId: design.id },
      { taskId: t1_9.id, userId: technical.id },
      { taskId: t1_10.id, userId: planner.id },
      { taskId: t1_10.id, userId: media.id },
      // P2 tasks
      { taskId: t2_1.id, userId: account.id },
      { taskId: t2_1.id, userId: nvkd.id },
      { taskId: t2_2.id, userId: design.id },
      { taskId: t2_3.id, userId: design.id },
      { taskId: t2_4.id, userId: content.id },
      { taskId: t2_5.id, userId: technical.id },
      // P3 tasks
      { taskId: t3_1.id, userId: design.id },
      { taskId: t3_2.id, userId: content.id },
      { taskId: t3_2.id, userId: design.id },
      { taskId: t3_3.id, userId: media.id },
      { taskId: t3_4.id, userId: media.id },
      { taskId: t3_5.id, userId: planner.id },
      { taskId: t3_5.id, userId: media.id },
    ],
  });

  // Task dependencies
  await prisma.taskDependency.createMany({
    data: [
      { taskId: t1_2.id, dependsOnTaskId: t1_1.id }, // creative depends on calendar
      { taskId: t1_3.id, dependsOnTaskId: t1_1.id }, // ad copy depends on calendar
      { taskId: t1_5.id, dependsOnTaskId: t1_2.id }, // batch 2 depends on batch 1
      { taskId: t1_6.id, dependsOnTaskId: t1_3.id }, // blog depends on ad copy
      { taskId: t2_3.id, dependsOnTaskId: t2_2.id }, // landing page depends on brand
      { taskId: t2_4.id, dependsOnTaskId: t2_2.id }, // content depends on brand
      { taskId: t3_3.id, dependsOnTaskId: t3_1.id }, // FB ads depends on key visual
      { taskId: t3_4.id, dependsOnTaskId: t3_2.id }, // TikTok depends on video
    ],
  });
  console.log('Created tasks + assignees + dependencies');

  // ═══════════════════════════════════════════════════════
  // PROJECT KPIs
  // ═══════════════════════════════════════════════════════
  await prisma.projectKPI.createMany({
    data: [
      // P1
      { projectId: p1.id, kpiType: 'CPL', targetValue: 50000, actualValue: 42000, unit: 'VND' },
      { projectId: p1.id, kpiType: 'CTR', targetValue: 2.5, actualValue: 2.9, unit: '%' },
      { projectId: p1.id, kpiType: 'ROAS', targetValue: 3.0, actualValue: 3.4, unit: 'x' },
      { projectId: p1.id, kpiType: 'CPA', targetValue: 80000, actualValue: 75000, unit: 'VND' },
      { projectId: p1.id, kpiType: 'Leads', targetValue: 500, actualValue: 180, unit: 'leads' },
      // P2
      { projectId: p2.id, kpiType: 'Brand Awareness', targetValue: 1000000, actualValue: 0, unit: 'impressions' },
      { projectId: p2.id, kpiType: 'Website Traffic', targetValue: 50000, actualValue: 0, unit: 'sessions' },
      { projectId: p2.id, kpiType: 'Signups', targetValue: 500, actualValue: 0, unit: 'users' },
      // P3
      { projectId: p3.id, kpiType: 'Store Visits', targetValue: 5000, actualValue: 6200, unit: 'visits' },
      { projectId: p3.id, kpiType: 'CTR', targetValue: 2.0, actualValue: 2.8, unit: '%' },
      { projectId: p3.id, kpiType: 'ROAS', targetValue: 2.0, actualValue: 2.5, unit: 'x' },
      { projectId: p3.id, kpiType: 'Social Engagement', targetValue: 10000, actualValue: 14500, unit: 'interactions' },
    ],
  });
  console.log('Created project KPIs');

  // ═══════════════════════════════════════════════════════
  // PROJECT LOGS
  // ═══════════════════════════════════════════════════════
  await prisma.projectLog.createMany({
    data: [
      // P1 - weekly logs
      { projectId: p1.id, logDate: d('2026-01-06'), rootCause: 'Setup tuan dau', action: 'Hoan thanh setup ads accounts, pixel, tracking', nextAction: 'Bat dau chay ads tuan 2', notes: 'Client da approve creative batch 1' },
      { projectId: p1.id, logDate: d('2026-01-13'), rootCause: 'Tuan 2 - Chay ads', action: 'Launch Facebook & Google campaigns. CPL dang tot hon target.', nextAction: 'Toi uu audiences, tang budget', notes: 'CTR Facebook dat 3.1%, tren target' },
      { projectId: p1.id, logDate: d('2026-01-20'), rootCause: 'Tuan 3 - Toi uu', action: 'A/B test ads creative. Tim ra top 3 performing ads.', nextAction: 'Scale top ads, tao creative moi', notes: 'CPL giam con 42K, target 50K' },
      { projectId: p1.id, logDate: d('2026-01-27'), rootCause: 'Tuan 4 - Scale', action: 'Tang budget cho top campaigns. Bat dau Google Display.', nextAction: 'Chuan bi media plan thang 2', notes: 'ROAS dat 3.4x, target 3.0x. Can them creative moi.' },
      // P2
      { projectId: p2.id, logDate: d('2026-01-20'), rootCause: 'Kickoff du an', action: 'Hop kickoff voi client. Thu thap brief.', nextAction: 'Hoan thanh market research', notes: 'Client muon launch truoc 15/3' },
      { projectId: p2.id, logDate: d('2026-01-27'), rootCause: 'Phase planning', action: 'Hoan thanh market research. Dang lam brand guidelines.', nextAction: 'Hoan thanh brand, bat dau landing page', notes: 'CANH BAO: Timeline tight, can day nhanh design' },
      // P3 - completed
      { projectId: p3.id, logDate: d('2025-12-08'), rootCause: 'Tuan 1 chien dich', action: 'Launch Facebook ads. Video quang cao dat 500K views.', nextAction: 'Push TikTok ads', notes: 'Engagement tot hon du kien' },
      { projectId: p3.id, logDate: d('2025-12-15'), rootCause: 'Tuan 2 - Tang toc', action: 'TikTok ads dat 1M views. Store visits tang 150%.', nextAction: 'Chuan bi su kien khai truong', notes: 'Da vuot KPI store visits' },
      { projectId: p3.id, logDate: d('2025-12-22'), rootCause: 'Khai truong', action: 'Su kien khai truong thanh cong. 3 chi nhanh mo cua.', nextAction: 'Thu thap data, lam bao cao', notes: '6200 luot ghe tham, target 5000' },
      { projectId: p3.id, logDate: d('2026-01-05'), rootCause: 'Tong ket', action: 'Hoan thanh bao cao cuoi ky. Nop cho client.', nextAction: 'Dong du an', notes: 'Client hai long. De xuat tiep tuc Q1/2026.' },
    ],
  });
  console.log('Created project logs');

  // ═══════════════════════════════════════════════════════
  // STAGE HISTORY
  // ═══════════════════════════════════════════════════════
  await prisma.stageHistory.createMany({
    data: [
      // P1
      { projectId: p1.id, fromStage: null, toStage: ProjectStage.INTAKE, fromProgress: 0, toProgress: 0, changedById: nvkd.id, reason: 'Du an moi tu client ABC', createdAt: d('2025-12-15') },
      { projectId: p1.id, fromStage: ProjectStage.INTAKE, toStage: ProjectStage.DISCOVERY, fromProgress: 0, toProgress: 100, changedById: pm.id, reason: 'Da nhan brief, bat dau tim hieu', createdAt: d('2025-12-18') },
      { projectId: p1.id, fromStage: ProjectStage.DISCOVERY, toStage: ProjectStage.PLANNING, fromProgress: 0, toProgress: 100, changedById: pm.id, reason: 'Hoan thanh discovery, bat dau lap ke hoach', createdAt: d('2025-12-22') },
      { projectId: p1.id, fromStage: ProjectStage.PLANNING, toStage: ProjectStage.UNDER_REVIEW, fromProgress: 0, toProgress: 100, changedById: planner.id, reason: 'Ke hoach hoan tat, cho client duyet', createdAt: d('2025-12-26') },
      { projectId: p1.id, fromStage: ProjectStage.UNDER_REVIEW, toStage: ProjectStage.ONGOING, fromProgress: 0, toProgress: 65, changedById: pm.id, reason: 'Client da duyet, bat dau trien khai', createdAt: d('2026-01-02') },
      // P2
      { projectId: p2.id, fromStage: null, toStage: ProjectStage.INTAKE, fromProgress: 0, toProgress: 0, changedById: nvkd.id, reason: 'Du an moi tu XYZ Tech', createdAt: d('2026-01-10') },
      { projectId: p2.id, fromStage: ProjectStage.INTAKE, toStage: ProjectStage.DISCOVERY, fromProgress: 0, toProgress: 100, changedById: pm.id, reason: 'Da nhan brief san pham SaaS', createdAt: d('2026-01-13') },
      { projectId: p2.id, fromStage: ProjectStage.DISCOVERY, toStage: ProjectStage.PLANNING, fromProgress: 0, toProgress: 40, changedById: pm.id, reason: 'Bat dau lap ke hoach, dang lam brand', createdAt: d('2026-01-20') },
      // P3 - full journey
      { projectId: p3.id, fromStage: null, toStage: ProjectStage.INTAKE, fromProgress: 0, toProgress: 0, changedById: nvkd.id, reason: 'Nhan du an khai truong MNO', createdAt: d('2025-10-20') },
      { projectId: p3.id, fromStage: ProjectStage.INTAKE, toStage: ProjectStage.DISCOVERY, fromProgress: 0, toProgress: 100, changedById: pm.id, createdAt: d('2025-10-25') },
      { projectId: p3.id, fromStage: ProjectStage.DISCOVERY, toStage: ProjectStage.PLANNING, fromProgress: 0, toProgress: 100, changedById: pm.id, createdAt: d('2025-11-01') },
      { projectId: p3.id, fromStage: ProjectStage.PLANNING, toStage: ProjectStage.PROPOSAL_PITCH, fromProgress: 0, toProgress: 100, changedById: planner.id, createdAt: d('2025-11-08') },
      { projectId: p3.id, fromStage: ProjectStage.PROPOSAL_PITCH, toStage: ProjectStage.ONGOING, fromProgress: 0, toProgress: 100, changedById: pm.id, reason: 'Client duyet proposal, bat dau!', createdAt: d('2025-11-15') },
      { projectId: p3.id, fromStage: ProjectStage.ONGOING, toStage: ProjectStage.COMPLETED, fromProgress: 100, toProgress: 100, changedById: pm.id, reason: 'Chien dich hoan tat. Bao cao da gui.', createdAt: d('2026-01-05') },
    ],
  });
  console.log('Created stage history');

  // ═══════════════════════════════════════════════════════
  // APPROVALS
  // ═══════════════════════════════════════════════════════
  const appr1 = await prisma.approval.create({
    data: {
      projectId: p1.id, type: ApprovalType.PLAN, status: ApprovalStatus.APPROVED, title: 'Duyet ke hoach marketing Q1',
      description: 'Ke hoach marketing tong the cho Q1/2026 bao gom media plan, content plan, va budget breakdown.',
      submittedById: planner.id, approvedById: nvkd.id, comment: 'LGTM. Budget hop ly. Trien khai.',
      deadline: d('2025-12-28'), submittedAt: d('2025-12-24'), respondedAt: d('2025-12-26'),
    },
  });
  const appr2 = await prisma.approval.create({
    data: {
      projectId: p1.id, type: ApprovalType.CONTENT, status: ApprovalStatus.APPROVED, title: 'Duyet content batch 1 - thang 1',
      description: '20 bai content cho social media thang 1.',
      submittedById: content.id, approvedById: pm.id, comment: 'Noi dung tot. Chi can sua 2 bai cuoi.',
      deadline: d('2026-01-08'), submittedAt: d('2026-01-05'), respondedAt: d('2026-01-06'),
    },
  });
  await prisma.approval.create({
    data: {
      projectId: p1.id, type: ApprovalType.BUDGET, status: ApprovalStatus.PENDING, title: 'Duyet ngan sach ads thang 2',
      description: 'De xuat tang budget Facebook Ads len 120M cho thang 2 do hieu qua tot o thang 1.',
      submittedById: media.id, deadline: d('2026-01-30'), submittedAt: d('2026-01-25'),
    },
  });
  const appr4 = await prisma.approval.create({
    data: {
      projectId: p1.id, type: ApprovalType.MEDIA_PLAN, status: ApprovalStatus.CHANGES_REQUESTED, title: 'Duyet media plan thang 2',
      description: 'Media plan thang 2 v1. Can dieu chinh phan bo kenh.',
      submittedById: planner.id, approvedById: nvkd.id, comment: 'Can tang budget Google Search, giam Display. Sua lai va nop.',
      deadline: d('2026-01-28'), submittedAt: d('2026-01-23'), respondedAt: d('2026-01-24'),
    },
  });
  await prisma.approval.create({
    data: {
      projectId: p2.id, type: ApprovalType.PLAN, status: ApprovalStatus.PENDING, title: 'Duyet ke hoach launch SaaS',
      description: 'Ke hoach ra mat san pham SaaS moi bao gom timeline, channels, budget.',
      submittedById: pm.id, deadline: d('2026-02-01'), submittedAt: d('2026-01-25'),
    },
  });
  const appr6 = await prisma.approval.create({
    data: {
      projectId: p3.id, type: ApprovalType.PLAN, status: ApprovalStatus.APPROVED, title: 'Duyet ke hoach Grand Opening',
      submittedById: planner.id, approvedById: nvkd.id, comment: 'Duyet. Budget va timeline OK.',
      submittedAt: d('2025-11-05'), respondedAt: d('2025-11-06'),
    },
  });
  const appr7 = await prisma.approval.create({
    data: {
      projectId: p3.id, type: ApprovalType.FILE, status: ApprovalStatus.APPROVED, title: 'Duyet key visual khai truong',
      submittedById: design.id, approvedById: pm.id, comment: 'Design dep. Duyet.',
      submittedAt: d('2025-11-18'), respondedAt: d('2025-11-19'),
    },
  });

  // Approval history
  await prisma.approvalHistory.createMany({
    data: [
      { approvalId: appr1.id, fromStatus: ApprovalStatus.PENDING, toStatus: ApprovalStatus.APPROVED, changedById: nvkd.id, comment: 'LGTM', changedAt: d('2025-12-26') },
      { approvalId: appr2.id, fromStatus: ApprovalStatus.PENDING, toStatus: ApprovalStatus.APPROVED, changedById: pm.id, comment: 'Duyet voi ghi chu', changedAt: d('2026-01-06') },
      { approvalId: appr4.id, fromStatus: ApprovalStatus.PENDING, toStatus: ApprovalStatus.CHANGES_REQUESTED, changedById: nvkd.id, comment: 'Can sua kenh allocation', changedAt: d('2026-01-24') },
      { approvalId: appr6.id, fromStatus: ApprovalStatus.PENDING, toStatus: ApprovalStatus.APPROVED, changedById: nvkd.id, changedAt: d('2025-11-06') },
      { approvalId: appr7.id, fromStatus: ApprovalStatus.PENDING, toStatus: ApprovalStatus.APPROVED, changedById: pm.id, changedAt: d('2025-11-19') },
    ],
  });
  console.log('Created approvals + history');

  // ═══════════════════════════════════════════════════════
  // EVENTS (calendar)
  // ═══════════════════════════════════════════════════════
  const ev1 = await prisma.event.create({
    data: {
      title: 'Weekly Sync - ABC Corp', description: 'Hop dong bo hang tuan voi team ABC Corp project.',
      type: EventType.MEETING, startTime: d('2026-01-27T09:00:00'), endTime: d('2026-01-27T10:00:00'),
      recurrence: 'WEEKLY', meetingLink: 'https://meet.google.com/abc-weekly', projectId: p1.id, createdById: pm.id, reminderBefore: 15,
    },
  });
  const ev2 = await prisma.event.create({
    data: {
      title: 'Client Review - ABC Corp thang 1', description: 'Review performance thang 1 voi client.',
      type: EventType.MEETING, startTime: d('2026-01-30T14:00:00'), endTime: d('2026-01-30T15:30:00'),
      meetingLink: 'https://meet.google.com/abc-review', projectId: p1.id, createdById: pm.id, reminderBefore: 30,
    },
  });
  const ev3 = await prisma.event.create({
    data: {
      title: 'Deadline - Creative batch 2', description: 'Han chot nop creative batch 2.',
      type: EventType.DEADLINE, startTime: d('2026-01-30T23:59:00'), isAllDay: false,
      projectId: p1.id, createdById: pm.id, reminderBefore: 60,
    },
  });
  const ev4 = await prisma.event.create({
    data: {
      title: 'Kickoff - XYZ Tech Launch', description: 'Hop kickoff du an XYZ Tech Product Launch.',
      type: EventType.MEETING, startTime: d('2026-01-15T10:00:00'), endTime: d('2026-01-15T11:30:00'),
      meetingLink: 'https://meet.google.com/xyz-kickoff', projectId: p2.id, createdById: pm.id,
    },
  });
  const ev5 = await prisma.event.create({
    data: {
      title: 'Milestone - Brand Guidelines Done', description: 'Hoan thanh brand guidelines XYZ Tech.',
      type: EventType.MILESTONE, startTime: d('2026-01-31T00:00:00'), isAllDay: true,
      projectId: p2.id, createdById: pm.id,
    },
  });

  // Event attendees
  await prisma.eventAttendee.createMany({
    data: [
      { eventId: ev1.id, userId: pm.id, status: 'accepted' },
      { eventId: ev1.id, userId: planner.id, status: 'accepted' },
      { eventId: ev1.id, userId: media.id, status: 'accepted' },
      { eventId: ev1.id, userId: content.id, status: 'accepted' },
      { eventId: ev2.id, userId: pm.id, status: 'accepted' },
      { eventId: ev2.id, userId: nvkd.id, status: 'accepted' },
      { eventId: ev2.id, userId: planner.id, status: 'accepted' },
      { eventId: ev2.id, email: 'khoa@abc-corp.vn', name: 'Nguyen Minh Khoa (Client)', status: 'accepted' },
      { eventId: ev3.id, userId: design.id, status: 'accepted' },
      { eventId: ev4.id, userId: pm.id, status: 'accepted' },
      { eventId: ev4.id, userId: nvkd.id, status: 'accepted' },
      { eventId: ev4.id, userId: account.id, status: 'accepted' },
      { eventId: ev4.id, email: 'bao@xyztech.io', name: 'Tran Quoc Bao (Client)', status: 'accepted' },
      { eventId: ev5.id, userId: design.id, status: 'pending' },
      { eventId: ev5.id, userId: pm.id, status: 'pending' },
    ],
  });
  console.log('Created events + attendees');

  // ═══════════════════════════════════════════════════════
  // COMMENTS
  // ═══════════════════════════════════════════════════════
  const c1 = await prisma.comment.create({
    data: { projectId: p1.id, content: 'Performance thang 1 rat tot. CPL thap hon target. De xuat tang budget thang 2.', authorId: media.id, createdAt: d('2026-01-25T10:30:00') },
  });
  await prisma.comment.create({
    data: { projectId: p1.id, content: 'Dong y. Can lap media plan thang 2 truoc 30/1.', authorId: pm.id, parentId: c1.id, createdAt: d('2026-01-25T11:00:00') },
  });
  await prisma.comment.create({
    data: { projectId: p1.id, content: 'Da submit media plan v1. Can review kenh allocation.', authorId: planner.id, parentId: c1.id, createdAt: d('2026-01-25T14:00:00') },
  });

  const c2 = await prisma.comment.create({
    data: { taskId: t1_5.id, content: 'Creative batch 2: 5 mau carousel da xong. Dang lam Google Display banner.', authorId: design.id, createdAt: d('2026-01-25T09:00:00') },
  });
  await prisma.comment.create({
    data: { taskId: t1_5.id, content: 'Tot. Nho lam them size Story/Reels nhe.', authorId: pm.id, parentId: c2.id, createdAt: d('2026-01-25T09:30:00') },
  });

  await prisma.comment.create({
    data: { projectId: p2.id, content: 'Client muon thay doi positioning. Can hop lai de align messaging.', authorId: account.id, createdAt: d('2026-01-26T08:00:00') },
  });
  await prisma.comment.create({
    data: { taskId: t2_5.id, content: 'Bi block vi chua co access vao Google Analytics cua client. Da gui yeu cau.', authorId: technical.id, createdAt: d('2026-01-24T16:00:00') },
  });

  await prisma.comment.create({
    data: { projectId: p3.id, content: 'Du an da hoan thanh. KPI vuot mong doi. Client de xuat hop tac Q1/2026.', authorId: pm.id, createdAt: d('2026-01-05T10:00:00') },
  });
  console.log('Created comments');

  // ═══════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      { userId: pm.id, type: 'APPROVAL', title: 'Budget thang 2 cho duyet', content: 'Ngo Thi Media da gui de xuat ngan sach ads thang 2 cho ABC Corp.', link: `/dashboard/projects/${p1.id}`, isRead: false, createdAt: d('2026-01-25T15:00:00') },
      { userId: nvkd.id, type: 'APPROVAL', title: 'Media plan cho duyet', content: 'Dang Thi Planner da submit media plan thang 2.', link: `/dashboard/projects/${p1.id}`, isRead: false, createdAt: d('2026-01-23T10:00:00') },
      { userId: design.id, type: 'TASK', title: 'Deadline sap toi', content: 'Creative batch 2 can hoan thanh truoc 30/1.', link: `/dashboard/projects/${p1.id}`, isRead: true, readAt: d('2026-01-26T08:00:00'), createdAt: d('2026-01-25T09:00:00') },
      { userId: planner.id, type: 'APPROVAL', title: 'Media plan can chinh sua', content: 'NVKD yeu cau thay doi kenh allocation trong media plan thang 2.', link: `/dashboard/projects/${p1.id}`, isRead: true, readAt: d('2026-01-24T14:00:00'), createdAt: d('2026-01-24T10:00:00') },
      { userId: content.id, type: 'TASK', title: 'Task moi: Viet blog SEO', content: 'Ban da duoc assign task "Viet blog posts SEO" cho ABC Corp.', link: `/dashboard/projects/${p1.id}`, isRead: true, readAt: d('2026-01-22T10:00:00'), createdAt: d('2026-01-22T09:00:00') },
      { userId: pm.id, type: 'COMMENT', title: 'Comment moi', content: 'Bui Van Account da binh luan ve du an XYZ Tech Launch.', link: `/dashboard/projects/${p2.id}`, isRead: false, createdAt: d('2026-01-26T08:05:00') },
      { userId: pm.id, type: 'TASK', title: 'Task bi block', content: 'Task "Setup tracking & analytics" (XYZ Tech) bi block do chua co GA access.', link: `/dashboard/projects/${p2.id}`, isRead: false, createdAt: d('2026-01-24T16:05:00') },
      { userId: nvkd.id, type: 'PROJECT', title: 'Du an hoan tat', content: 'Du an MNO F&B Grand Opening da chuyen sang trang thai COMPLETED.', link: `/dashboard/projects/${p3.id}`, isRead: true, readAt: d('2026-01-05T11:00:00'), createdAt: d('2026-01-05T10:00:00') },
      { userId: media.id, type: 'BUDGET', title: 'De xuat bi tu choi', content: 'De xuat booking KOL cho ABC Corp da bi tu choi do vuot ngan sach.', link: `/dashboard/projects/${p1.id}`, isRead: true, readAt: d('2026-01-16T09:00:00'), createdAt: d('2026-01-15T17:00:00') },
      { userId: pm.id, type: 'BUDGET', title: 'Canh bao ngan sach', content: 'Du an ABC Corp da su dung 30% ngan sach (152M/500M VND).', link: `/dashboard/projects/${p1.id}`, isRead: true, readAt: d('2026-01-27T08:30:00'), createdAt: d('2026-01-27T08:00:00') },
    ],
  });
  console.log('Created notifications');

  // ═══════════════════════════════════════════════════════
  // SYSTEM SETTINGS
  // ═══════════════════════════════════════════════════════
  await prisma.systemSetting.createMany({
    data: [
      { key: 'app_name', value: JSON.stringify('BC Agency PMS') },
      { key: 'default_language', value: JSON.stringify('vi') },
      { key: 'notification_email_enabled', value: JSON.stringify(true) },
      { key: 'notification_telegram_enabled', value: JSON.stringify(false) },
      { key: 'budget_threshold_warning', value: JSON.stringify(80) },
      { key: 'budget_threshold_critical', value: JSON.stringify(100) },
    ],
  });
  console.log('Created system settings');

  // ═══════════════════════════════════════════════════════
  // SALES PIPELINE - 6 pipelines at various stages
  // ═══════════════════════════════════════════════════════

  // Pipeline 1: ACCEPTED - already converted to project p1
  const pipe1 = await prisma.salesPipeline.create({
    data: {
      projectName: 'ABC Corp - Q1 Digital Marketing',
      status: PipelineStage.WON,
      currentStage: ProjectStage.ONGOING,
      nvkdId: nvkd.id,
      pmId: pm.id,
      plannerId: planner.id,
      clientType: 'Enterprise',
      productType: 'Digital Marketing',
      campaignObjective: 'Brand awareness & lead generation cho Q1/2026',
      initialGoal: 'Tang 30% brand awareness, 500 leads/thang',
      totalBudget: 150000000,
      monthlyBudget: 50000000,
      spentAmount: 0,
      fixedAdFee: 10000000,
      adServiceFee: 5000000,
      contentFee: 8000000,
      designFee: 5000000,
      mediaFee: 3000000,
      otherFee: 2000000,
      upsellOpportunity: 'Co the mo rong sang TikTok Ads Q2',
      costNSQC: 12000000,
      costDesign: 8000000,
      costMedia: 5000000,
      costKOL: 15000000,
      costOther: 3000000,
      cogs: 43000000,
      grossProfit: 107000000,
      profitMargin: 71.33,
      clientTier: ClientTier.A,
      marketSize: 'Lon - thi truong FMCG',
      competitionLevel: 'Cao',
      productUSP: 'Brand uy tin 20 nam, san pham da dang',
      averageScore: 8.5,
      audienceSize: '5 trieu nguoi 25-45 tuoi',
      productLifecycle: 'Mature',
      scalePotential: 'Cao - co the scale len 300tr/thang',
      weeklyNotes: [
        { week: 1, date: '2025-12-20T00:00:00.000Z', note: 'Khach hang da gui brief. NVKD gap PM de ban giao.', authorId: nvkd.id },
        { week: 2, date: '2025-12-27T00:00:00.000Z', note: 'PM da danh gia xong. Cost structure hop ly, margin tot.', authorId: pm.id },
        { week: 3, date: '2026-01-03T00:00:00.000Z', note: 'Da accept pipeline. Bat dau setup project.', authorId: pm.id },
      ],
      decision: PipelineDecision.ACCEPTED,
      decisionDate: d('2026-01-03'),
      decisionNote: 'Margin tot, khach hang tier A, accept ngay.',
      projectId: p1.id,
    },
  });

  // Pipeline 2: ACCEPTED - converted to project p2
  const pipe2 = await prisma.salesPipeline.create({
    data: {
      projectName: 'XYZ Tech - Product Launch SaaS',
      status: PipelineStage.WON,
      currentStage: ProjectStage.PLANNING,
      nvkdId: nvkd.id,
      pmId: pm.id,
      clientType: 'Startup',
      productType: 'Product Launch',
      campaignObjective: 'Ra mat san pham SaaS moi, target 1000 signups',
      initialGoal: '1000 signups trong 3 thang dau',
      totalBudget: 80000000,
      monthlyBudget: 26700000,
      fixedAdFee: 8000000,
      adServiceFee: 3000000,
      contentFee: 5000000,
      designFee: 4000000,
      mediaFee: 2000000,
      costNSQC: 8000000,
      costDesign: 6000000,
      costMedia: 3000000,
      costKOL: 0,
      costOther: 2000000,
      cogs: 19000000,
      grossProfit: 61000000,
      profitMargin: 76.25,
      clientTier: ClientTier.B,
      marketSize: 'Trung binh - SaaS B2B',
      competitionLevel: 'Trung binh',
      productUSP: 'AI-powered, gia canh tranh',
      averageScore: 7.0,
      weeklyNotes: [
        { week: 1, date: '2026-01-10T00:00:00.000Z', note: 'Startup moi, budget vua phai nhung co tiem nang.', authorId: nvkd.id },
        { week: 2, date: '2026-01-17T00:00:00.000Z', note: 'PM danh gia: margin kha, accept de chay pilot.', authorId: pm.id },
      ],
      decision: PipelineDecision.ACCEPTED,
      decisionDate: d('2026-01-18'),
      decisionNote: 'Accept, margin tot du budget nho. Co the upsell sau.',
      projectId: p2.id,
    },
  });

  // Pipeline 3: NEGOTIATION stage - pending decision
  const pipe3 = await prisma.salesPipeline.create({
    data: {
      projectName: 'Sunshine Group - Social Media Q2',
      status: PipelineStage.NEGOTIATION,
      currentStage: ProjectStage.INTAKE,
      nvkdId: nvkd.id,
      pmId: pm.id,
      plannerId: planner.id,
      clientType: 'Corporate',
      productType: 'Social Media Management',
      campaignObjective: 'Quan ly Social Media 3 kenh: Facebook, Instagram, TikTok',
      initialGoal: 'Tang followers 50%, engagement rate 5%',
      totalBudget: 200000000,
      monthlyBudget: 66700000,
      fixedAdFee: 15000000,
      adServiceFee: 7000000,
      contentFee: 12000000,
      designFee: 8000000,
      mediaFee: 5000000,
      otherFee: 3000000,
      costNSQC: 15000000,
      costDesign: 10000000,
      costMedia: 6000000,
      costKOL: 20000000,
      costOther: 5000000,
      cogs: 56000000,
      grossProfit: 144000000,
      profitMargin: 72.0,
      clientTier: ClientTier.A,
      marketSize: 'Lon - bat dong san',
      competitionLevel: 'Rat cao',
      productUSP: 'Top 5 bat dong san VN',
      averageScore: 8.0,
      audienceSize: '10 trieu nguoi 25-55 tuoi',
      productLifecycle: 'Growth',
      scalePotential: 'Rat cao - nhieu du an con',
      weeklyNotes: [
        { week: 1, date: '2026-01-20T00:00:00.000Z', note: 'Khach hang lon, budget cao. Dang thuong luong chi tiet.', authorId: nvkd.id },
        { week: 2, date: '2026-01-27T00:00:00.000Z', note: 'PM da danh gia cost. Cho khach hang xac nhan budget cuoi cung.', authorId: pm.id },
      ],
      decision: PipelineDecision.PENDING,
    },
  });

  // Pipeline 4: EVALUATION stage
  const pipe4 = await prisma.salesPipeline.create({
    data: {
      projectName: 'FoodPanda VN - Tet Campaign 2027',
      status: PipelineStage.EVALUATION,
      currentStage: ProjectStage.INTAKE,
      nvkdId: nvkd.id,
      pmId: pm.id,
      clientType: 'MNC',
      productType: 'Seasonal Campaign',
      campaignObjective: 'Chien dich Tet 2027: tang don hang 40%',
      initialGoal: '40% tang don hang, 2 trieu impressions',
      totalBudget: 300000000,
      monthlyBudget: 100000000,
      fixedAdFee: 20000000,
      contentFee: 15000000,
      designFee: 10000000,
      mediaFee: 8000000,
      costNSQC: 18000000,
      costDesign: 12000000,
      costMedia: 8000000,
      costKOL: 30000000,
      costOther: 7000000,
      cogs: 75000000,
      grossProfit: 225000000,
      profitMargin: 75.0,
      clientTier: ClientTier.A,
      weeklyNotes: [
        { week: 1, date: '2026-01-25T00:00:00.000Z', note: 'Khach hang MNC budget lon, PM dang evaluate.', authorId: nvkd.id },
      ],
      decision: PipelineDecision.PENDING,
    },
  });

  // Pipeline 5: QUALIFIED stage (early)
  const pipe5 = await prisma.salesPipeline.create({
    data: {
      projectName: 'Green Coffee - Brand Refresh',
      status: PipelineStage.QUALIFIED,
      currentStage: ProjectStage.INTAKE,
      nvkdId: nvkd.id,
      clientType: 'SME',
      productType: 'Branding',
      campaignObjective: 'Lam moi thuong hieu, redesign logo va brand guidelines',
      initialGoal: 'Brand kit moi trong 2 thang',
      totalBudget: 50000000,
      monthlyBudget: 25000000,
      contentFee: 5000000,
      designFee: 15000000,
      decision: PipelineDecision.PENDING,
    },
  });

  // Pipeline 6: DECLINED
  const pipe6 = await prisma.salesPipeline.create({
    data: {
      projectName: 'QuickShop - Flash Sale App',
      status: PipelineStage.LOST,
      currentStage: ProjectStage.INTAKE,
      nvkdId: nvkd.id,
      pmId: pm.id,
      clientType: 'Startup',
      productType: 'Performance Marketing',
      campaignObjective: 'Chay ads cho app thuong mai dien tu moi',
      totalBudget: 30000000,
      monthlyBudget: 10000000,
      fixedAdFee: 3000000,
      costNSQC: 5000000,
      costDesign: 3000000,
      costMedia: 2000000,
      cogs: 10000000,
      grossProfit: 20000000,
      profitMargin: 66.67,
      clientTier: ClientTier.D,
      averageScore: 4.0,
      weeklyNotes: [
        { week: 1, date: '2026-01-15T00:00:00.000Z', note: 'Budget qua thap, khach hang chua ro muc tieu.', authorId: nvkd.id },
        { week: 2, date: '2026-01-22T00:00:00.000Z', note: 'PM tu choi: margin thap, risk cao.', authorId: pm.id },
      ],
      decision: PipelineDecision.DECLINED,
      decisionDate: d('2026-01-22'),
      decisionNote: 'Budget qua thap, client tier D, risk khong dang.',
    },
  });
  console.log('Created 6 sales pipelines');

  // ═══════════════════════════════════════════════════════
  // STRATEGIC BRIEFS - for accepted pipelines
  // ═══════════════════════════════════════════════════════
  const SECTION_DEFS = [
    { num: 1, key: 'brand_overview', title: 'Tổng quan thương hiệu' },
    { num: 2, key: 'market_analysis', title: 'Phân tích thị trường' },
    { num: 3, key: 'target_audience', title: 'Đối tượng mục tiêu' },
    { num: 4, key: 'campaign_objectives', title: 'Mục tiêu chiến dịch' },
    { num: 5, key: 'key_messages', title: 'Thông điệp chính' },
    { num: 6, key: 'creative_direction', title: 'Định hướng sáng tạo' },
    { num: 7, key: 'media_strategy', title: 'Chiến lược truyền thông' },
    { num: 8, key: 'content_strategy', title: 'Chiến lược nội dung' },
    { num: 9, key: 'kol_influencer', title: 'KOL/Influencer' },
    { num: 10, key: 'budget_allocation', title: 'Phân bổ ngân sách' },
    { num: 11, key: 'timeline', title: 'Timeline' },
    { num: 12, key: 'kpi_metrics', title: 'KPI & Metrics' },
    { num: 13, key: 'competitors', title: 'Đối thủ cạnh tranh' },
    { num: 14, key: 'deliverables', title: 'Sản phẩm bàn giao' },
    { num: 15, key: 'approval_process', title: 'Quy trình duyệt' },
    { num: 16, key: 'additional_notes', title: 'Ghi chú bổ sung' },
  ];

  // Brief 1: For pipeline 1 (APPROVED - mostly filled)
  const brief1 = await prisma.strategicBrief.create({
    data: {
      pipelineId: pipe1.id,
      projectId: p1.id,
      status: BriefStatus.APPROVED,
      completionPct: 100,
      submittedAt: d('2026-01-05'),
      approvedAt: d('2026-01-06'),
      sections: {
        createMany: {
          data: SECTION_DEFS.map((s) => ({
            sectionNum: s.num,
            sectionKey: s.key,
            title: s.title,
            isComplete: true,
            data: s.key === 'brand_overview'
              ? { brandName: 'ABC Corporation', industry: 'FMCG', brandStory: 'Thuong hieu 20 nam trong nganh FMCG' }
              : s.key === 'target_audience'
              ? { primaryAge: '25-45', gender: 'All', location: 'TP.HCM, Ha Noi, Da Nang', interests: 'Shopping, Social Media' }
              : s.key === 'budget_allocation'
              ? { items: [{ category: 'Media Ads', amount: 80000000, percentage: 53 }, { category: 'Content', amount: 30000000, percentage: 20 }, { category: 'Design', amount: 20000000, percentage: 13 }, { category: 'KOL', amount: 15000000, percentage: 10 }, { category: 'Other', amount: 5000000, percentage: 4 }] }
              : s.key === 'kpi_metrics'
              ? { kpis: [{ name: 'Reach', target: '5000000', unit: 'impressions' }, { name: 'Engagement Rate', target: '5', unit: '%' }, { name: 'Leads', target: '500', unit: 'leads/month' }, { name: 'ROAS', target: '4', unit: 'x' }] }
              : { notes: `Da hoan thanh section ${s.key}` },
          })),
        },
      },
    },
  });

  // Brief 2: For pipeline 2 (DRAFT - partially filled)
  const brief2 = await prisma.strategicBrief.create({
    data: {
      pipelineId: pipe2.id,
      projectId: p2.id,
      status: BriefStatus.DRAFT,
      completionPct: 38,
      sections: {
        createMany: {
          data: SECTION_DEFS.map((s) => ({
            sectionNum: s.num,
            sectionKey: s.key,
            title: s.title,
            isComplete: s.num <= 6,
            data: s.num <= 6
              ? s.key === 'brand_overview'
                ? { brandName: 'XYZ Tech', industry: 'SaaS', brandStory: 'Startup AI-powered SaaS' }
                : { notes: `Draft content for ${s.key}` }
              : undefined,
          })),
        },
      },
    },
  });

  // Brief 3: For pipeline 3 (pending pipeline, no brief yet but create empty one for demo)
  const brief3 = await prisma.strategicBrief.create({
    data: {
      pipelineId: pipe3.id,
      status: BriefStatus.DRAFT,
      completionPct: 0,
      sections: {
        createMany: {
          data: SECTION_DEFS.map((s) => ({
            sectionNum: s.num,
            sectionKey: s.key,
            title: s.title,
            isComplete: false,
          })),
        },
      },
    },
  });
  console.log('Created 3 strategic briefs with sections');

  // ═══════════════════════════════════════════════════════
  // PROJECT PHASES - for all 3 projects
  // ═══════════════════════════════════════════════════════
  const PHASE_DEFS = [
    {
      phaseType: ProjectPhaseType.KHOI_TAO_PLAN,
      name: 'Khởi tạo & Lập kế hoạch',
      weight: 50,
      orderIndex: 0,
      items: [
        { name: 'Intake', weight: 5, orderIndex: 0 },
        { name: 'Discovery', weight: 5, orderIndex: 1 },
        { name: 'Planning', weight: 25, orderIndex: 2 },
        { name: 'Pitching', weight: 15, orderIndex: 3 },
      ],
    },
    {
      phaseType: ProjectPhaseType.SETUP_CHUAN_BI,
      name: 'Setup & Chuẩn bị',
      weight: 10,
      orderIndex: 1,
      items: [
        { name: 'Internal Kick-off', weight: 2, orderIndex: 0 },
        { name: 'Client Kick-off', weight: 2, orderIndex: 1 },
        { name: 'System Setup', weight: 6, orderIndex: 2 },
      ],
    },
    {
      phaseType: ProjectPhaseType.VAN_HANH_TOI_UU,
      name: 'Vận hành & Tối ưu',
      weight: 30,
      orderIndex: 2,
      items: [
        { name: 'Performance & Reporting', weight: 30, orderIndex: 0 },
      ],
    },
    {
      phaseType: ProjectPhaseType.TONG_KET,
      name: 'Tổng kết',
      weight: 10,
      orderIndex: 3,
      items: [
        { name: 'Closure & BBNT', weight: 10, orderIndex: 0 },
      ],
    },
  ];

  // Helper to create phases for a project
  async function createPhasesForProject(
    projectId: string,
    completionMap: Record<string, boolean[]>,
    linkedTasks?: Record<string, string>,
  ) {
    for (const phaseDef of PHASE_DEFS) {
      const completions = completionMap[phaseDef.phaseType] || phaseDef.items.map(() => false);
      const completedWeight = phaseDef.items.reduce(
        (sum, item, idx) => sum + (completions[idx] ? item.weight : 0), 0
      );
      const totalWeight = phaseDef.items.reduce((sum, item) => sum + item.weight, 0);
      const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

      await prisma.projectPhase.create({
        data: {
          projectId,
          phaseType: phaseDef.phaseType,
          name: phaseDef.name,
          weight: phaseDef.weight,
          orderIndex: phaseDef.orderIndex,
          progress,
          items: {
            createMany: {
              data: phaseDef.items.map((item, idx) => ({
                name: item.name,
                weight: item.weight,
                orderIndex: item.orderIndex,
                isComplete: completions[idx] || false,
                taskId: linkedTasks?.[`${phaseDef.phaseType}_${idx}`] || undefined,
              })),
            },
          },
        },
      });
    }
  }

  // P1 (ONGOING, 65% stage): Phases 1 done, Phase 2 done, Phase 3 in progress
  await createPhasesForProject(p1.id, {
    [ProjectPhaseType.KHOI_TAO_PLAN]: [true, true, true, true],
    [ProjectPhaseType.SETUP_CHUAN_BI]: [true, true, true],
    [ProjectPhaseType.VAN_HANH_TOI_UU]: [false],
    [ProjectPhaseType.TONG_KET]: [false],
  }, {
    [`${ProjectPhaseType.KHOI_TAO_PLAN}_2`]: t1_1.id,
    [`${ProjectPhaseType.SETUP_CHUAN_BI}_2`]: t1_3.id,
  });

  // P2 (PLANNING, 40% stage): Phase 1 partially done
  await createPhasesForProject(p2.id, {
    [ProjectPhaseType.KHOI_TAO_PLAN]: [true, true, false, false],
    [ProjectPhaseType.SETUP_CHUAN_BI]: [false, false, false],
    [ProjectPhaseType.VAN_HANH_TOI_UU]: [false],
    [ProjectPhaseType.TONG_KET]: [false],
  }, {
    [`${ProjectPhaseType.KHOI_TAO_PLAN}_0`]: t2_1.id,
  });

  // P3 (COMPLETED, 100%): All phases done
  await createPhasesForProject(p3.id, {
    [ProjectPhaseType.KHOI_TAO_PLAN]: [true, true, true, true],
    [ProjectPhaseType.SETUP_CHUAN_BI]: [true, true, true],
    [ProjectPhaseType.VAN_HANH_TOI_UU]: [true],
    [ProjectPhaseType.TONG_KET]: [true],
  });
  console.log('Created project phases for 3 projects (4 phases x 3 = 12 phases, 27 items)');

  // ═══════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n========================================');
  console.log('Seeding completed!');
  console.log('========================================\n');
  console.log('Data Summary:');
  console.log('  Users: 10 (all roles)');
  console.log('  Clients: 3');
  console.log('  Projects: 3 (ONGOING / PLANNING / COMPLETED)');
  console.log(`  Ads Reports: ${adsReports.length}`);
  console.log('  Budget Events: 22');
  console.log('  Media Plans: 15 (3 ADS + 6 DESIGN + 6 CONTENT, with detailed items)');
  console.log('  Tasks: 18 (with subtasks, assignees, dependencies)');
  console.log('  Approvals: 7 (with history)');
  console.log('  Events: 5 (with attendees)');
  console.log('  Comments: 8 (with replies)');
  console.log('  Notifications: 10');
  console.log('  Sales Pipelines: 6 (WON x2, NEGOTIATION, EVALUATION, QUALIFIED, LOST)');
  console.log('  Strategic Briefs: 3 (APPROVED, DRAFT, empty DRAFT)');
  console.log('  Project Phases: 12 (4 phases x 3 projects, 27 items)');
  console.log('');
  console.log('Test Accounts (password: Admin@123):');
  console.log('  Super Admin   : admin@bcagency.com');
  console.log('  Admin         : admin2@bcagency.com');
  console.log('  Technical     : tech@bcagency.com');
  console.log('  NVKD (Sales)  : sales@bcagency.com');
  console.log('  PM            : pm@bcagency.com');
  console.log('  Planner       : planner@bcagency.com');
  console.log('  Account       : account@bcagency.com');
  console.log('  Content       : content@bcagency.com');
  console.log('  Design        : design@bcagency.com');
  console.log('  Media         : media@bcagency.com');
  console.log('');
  console.log('Client Access Codes:');
  console.log('  ABC Corporation  : ABC123');
  console.log('  XYZ Tech         : XYZ456');
  console.log('  MNO F&B Group    : MNO789');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
