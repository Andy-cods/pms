# Phase 4: Ads Report + Zapier Integration

## Context

- **Parent plan:** [plan.md](./plan.md)
- **Dependencies:** Phase 1 establishes the controller/service/DTO pattern reused here
- **Blocked by:** Phase 1 (for pattern consistency; can start in parallel if developer reads Phase 1 first)

## Overview

- **Date:** 2026-01-28
- **Description:** New AdsReport Prisma model, full backend module (service + controller + DTOs), Zapier webhook endpoint for automated data ingestion, and frontend ads report tab with KPI cards, trend line chart, data table, and manual input form.
- **Priority:** HIGH
- **Implementation Status:** COMPLETED
- **Review Status:** COMPLETED

## Key Insights

1. Existing `IntegrationController` at `backend/src/presentation/controllers/integration.controller.ts` handles Pancake webhook. We add a parallel Zapier webhook route.
2. Webhook auth: existing pattern uses header secret (`x-pancake-secret`). We use `x-zapier-api-key` header for Zapier.
3. Frontend project detail page already has segment tabs (overview, team, budget, kpi, logs, history). We add "Bao cao Ads" tab.
4. `recharts` LineChart already available (v3.7). Use `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`.
5. New module follows project-module pattern: service in `modules/`, controller in `presentation/controllers/`, DTOs in `application/dto/`.
6. `source` field distinguishes manual entries from Zapier imports.

## Requirements

1. New Prisma model `AdsReport` with fields: id, projectId, period, reportDate, impressions, clicks, ctr, cpc, cpm, cpa, conversions, roas, adSpend, platform, campaignName, source, createdById, createdAt
2. Enums: `AdsReportPeriod` (DAILY, WEEKLY, MONTHLY), `AdsPlatform` (FACEBOOK, GOOGLE, TIKTOK, OTHER), `AdsReportSource` (MANUAL, ZAPIER)
3. Backend: AdsReport service with CRUD + list with filters
4. Backend: AdsReport controller following budget-event pattern
5. Backend: Webhook endpoint `POST /integrations/webhook/ads-report` with API key validation
6. Frontend: New "Bao cao Ads" tab in project detail
7. Frontend: KPI cards row (Impressions, Clicks, CTR, CPC, Conversions, ROAS)
8. Frontend: Line chart showing trends over time
9. Frontend: Data table with filters (platform, period, date range)
10. Frontend: Manual input form dialog
11. Frontend: New hook `use-ads-reports.ts` + API client `ads-reports.ts`

## Architecture

```
backend/
  prisma/schema.prisma                                    # Add AdsReport model + enums
  prisma/migrations/XXXX_add_ads_report/
  src/application/dto/ads-report.dto.ts                   # NEW: Create, Query, Response DTOs
  src/modules/ads-report/ads-report.service.ts            # NEW: CRUD service
  src/modules/ads-report/ads-report.module.ts             # NEW: NestJS module
  src/presentation/controllers/ads-report.controller.ts   # NEW: REST controller
  src/presentation/controllers/integration.controller.ts  # MODIFY: Add Zapier webhook

frontend/
  src/lib/api/ads-reports.ts                              # NEW: API client
  src/hooks/use-ads-reports.ts                            # NEW: TanStack Query hooks
  src/components/project/ads-kpi-cards.tsx                # NEW: KPI summary cards
  src/components/project/ads-trend-chart.tsx              # NEW: recharts LineChart
  src/components/project/ads-report-table.tsx             # NEW: Data table with filters
  src/components/project/ads-report-modal.tsx             # NEW: Manual input form dialog
  src/app/dashboard/projects/[id]/page.tsx                # MODIFY: Add "Bao cao Ads" tab
  src/types/index.ts                                      # MODIFY: Add AdsReport types
```

## Related Code Files

| File | Action | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | MODIFY | Add `AdsReport` model, `AdsReportPeriod`, `AdsPlatform`, `AdsReportSource` enums |
| `backend/src/application/dto/ads-report.dto.ts` | CREATE | `CreateAdsReportDto`, `AdsReportQueryDto`, `AdsReportResponse` |
| `backend/src/modules/ads-report/ads-report.service.ts` | CREATE | CRUD service with list, create, summary aggregation |
| `backend/src/modules/ads-report/ads-report.module.ts` | CREATE | Module registering service + controller |
| `backend/src/presentation/controllers/ads-report.controller.ts` | CREATE | REST endpoints for ads reports |
| `backend/src/presentation/controllers/integration.controller.ts` | MODIFY | Add Zapier webhook route |
| `backend/src/main.ts` | MODIFY | Import AdsReportModule (if not auto-discovered) |
| `frontend/src/lib/api/ads-reports.ts` | CREATE | API client functions |
| `frontend/src/hooks/use-ads-reports.ts` | CREATE | TanStack Query hooks |
| `frontend/src/components/project/ads-kpi-cards.tsx` | CREATE | KPI summary row |
| `frontend/src/components/project/ads-trend-chart.tsx` | CREATE | Line chart component |
| `frontend/src/components/project/ads-report-table.tsx` | CREATE | Data table with filters |
| `frontend/src/components/project/ads-report-modal.tsx` | CREATE | Manual input dialog |
| `frontend/src/app/dashboard/projects/[id]/page.tsx` | MODIFY | Add "Bao cao Ads" tab to SegmentControl + render |
| `frontend/src/types/index.ts` | MODIFY | Add AdsReport enums and interfaces |

## Implementation Steps

### Step 1: Prisma Schema - Add Enums

Add to `backend/prisma/schema.prisma`:

```prisma
enum AdsReportPeriod {
  DAILY
  WEEKLY
  MONTHLY
}

enum AdsPlatform {
  FACEBOOK
  GOOGLE
  TIKTOK
  OTHER
}

enum AdsReportSource {
  MANUAL
  ZAPIER
}
```

### Step 2: Prisma Schema - Add AdsReport Model

```prisma
model AdsReport {
  id           String           @id @default(cuid())
  projectId    String
  period       AdsReportPeriod
  reportDate   DateTime
  impressions  Int              @default(0)
  clicks       Int              @default(0)
  ctr          Float            @default(0)
  cpc          Decimal          @default(0) @db.Decimal(10, 2)
  cpm          Decimal          @default(0) @db.Decimal(10, 2)
  cpa          Decimal          @default(0) @db.Decimal(10, 2)
  conversions  Int              @default(0)
  roas         Float            @default(0)
  adSpend      Decimal          @default(0) @db.Decimal(15, 2)
  platform     AdsPlatform
  campaignName String?
  source       AdsReportSource  @default(MANUAL)
  createdById  String
  createdAt    DateTime         @default(now())
  project      Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy    User             @relation("AdsReportCreator", fields: [createdById], references: [id])

  @@index([projectId])
  @@index([reportDate])
  @@index([platform])
  @@index([period])
  @@map("ads_reports")
}
```

Also add relations to `Project` and `User` models:

In `Project` model, add:
```prisma
  adsReports   AdsReport[]
```

In `User` model, add:
```prisma
  adsReportsCreated AdsReport[] @relation("AdsReportCreator")
```

### Step 3: Generate Migration

```bash
cd backend
npx prisma migrate dev --name add_ads_report
```

### Step 4: Create Backend DTOs

Create `backend/src/application/dto/ads-report.dto.ts`:

```typescript
import { IsNumber, IsOptional, IsString, IsIn, IsDateString, Min } from 'class-validator';

export const AdsReportPeriods = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type AdsReportPeriod = (typeof AdsReportPeriods)[number];

export const AdsPlatforms = ['FACEBOOK', 'GOOGLE', 'TIKTOK', 'OTHER'] as const;
export type AdsPlatform = (typeof AdsPlatforms)[number];

export const AdsReportSources = ['MANUAL', 'ZAPIER'] as const;
export type AdsReportSource = (typeof AdsReportSources)[number];

export class CreateAdsReportDto {
  @IsIn(AdsReportPeriods)
  period!: AdsReportPeriod;

  @IsDateString()
  reportDate!: string;

  @IsNumber()
  @Min(0)
  impressions!: number;

  @IsNumber()
  @Min(0)
  clicks!: number;

  @IsNumber()
  @Min(0)
  ctr!: number;

  @IsNumber()
  @Min(0)
  cpc!: number;

  @IsNumber()
  @Min(0)
  cpm!: number;

  @IsNumber()
  @Min(0)
  cpa!: number;

  @IsNumber()
  @Min(0)
  conversions!: number;

  @IsNumber()
  @Min(0)
  roas!: number;

  @IsNumber()
  @Min(0)
  adSpend!: number;

  @IsIn(AdsPlatforms)
  platform!: AdsPlatform;

  @IsOptional()
  @IsString()
  campaignName?: string;
}

export class AdsReportQueryDto {
  @IsOptional()
  @IsIn(AdsPlatforms)
  platform?: AdsPlatform;

  @IsOptional()
  @IsIn(AdsReportPeriods)
  period?: AdsReportPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface AdsReportResponse {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: Date;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: Date;
}

export interface AdsReportSummary {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalConversions: number;
  avgRoas: number;
  totalAdSpend: number;
}
```

### Step 5: Create Backend Service

Create `backend/src/modules/ads-report/ads-report.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
} from '../../application/dto/ads-report.dto.js';

@Injectable()
export class AdsReportService {
  constructor(private prisma: PrismaService) {}

  async list(projectId: string, query: AdsReportQueryDto): Promise<AdsReportResponse[]> {
    const where: any = { projectId };
    if (query.platform) where.platform = query.platform;
    if (query.period) where.period = query.period;
    if (query.startDate || query.endDate) {
      where.reportDate = {};
      if (query.startDate) where.reportDate.gte = new Date(query.startDate);
      if (query.endDate) where.reportDate.lte = new Date(query.endDate);
    }

    const reports = await this.prisma.adsReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return reports.map(r => this.map(r));
  }

  async summary(projectId: string, query: AdsReportQueryDto): Promise<AdsReportSummary> {
    const reports = await this.list(projectId, query);
    if (reports.length === 0) {
      return { totalImpressions: 0, totalClicks: 0, avgCtr: 0, avgCpc: 0, totalConversions: 0, avgRoas: 0, totalAdSpend: 0 };
    }

    const totalImpressions = reports.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = reports.reduce((s, r) => s + r.clicks, 0);
    const totalConversions = reports.reduce((s, r) => s + r.conversions, 0);
    const totalAdSpend = reports.reduce((s, r) => s + r.adSpend, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalAdSpend / totalClicks : 0;
    const avgRoas = reports.reduce((s, r) => s + r.roas, 0) / reports.length;

    return { totalImpressions, totalClicks, avgCtr: +avgCtr.toFixed(2), avgCpc: +avgCpc.toFixed(2), totalConversions, avgRoas: +avgRoas.toFixed(2), totalAdSpend };
  }

  async create(projectId: string, userId: string, dto: CreateAdsReportDto, source: string = 'MANUAL'): Promise<AdsReportResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) throw new NotFoundException('Project not found');

    const created = await this.prisma.adsReport.create({
      data: {
        projectId,
        period: dto.period,
        reportDate: new Date(dto.reportDate),
        impressions: dto.impressions,
        clicks: dto.clicks,
        ctr: dto.ctr,
        cpc: dto.cpc,
        cpm: dto.cpm,
        cpa: dto.cpa,
        conversions: dto.conversions,
        roas: dto.roas,
        adSpend: dto.adSpend,
        platform: dto.platform,
        campaignName: dto.campaignName,
        source: source as any,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return this.map(created);
  }

  private map(report: any): AdsReportResponse {
    return {
      id: report.id,
      projectId: report.projectId,
      period: report.period,
      reportDate: report.reportDate,
      impressions: report.impressions,
      clicks: report.clicks,
      ctr: report.ctr,
      cpc: Number(report.cpc),
      cpm: Number(report.cpm),
      cpa: Number(report.cpa),
      conversions: report.conversions,
      roas: report.roas,
      adSpend: Number(report.adSpend),
      platform: report.platform,
      campaignName: report.campaignName,
      source: report.source,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
    };
  }
}
```

### Step 6: Create Backend Module

Create `backend/src/modules/ads-report/ads-report.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdsReportService } from './ads-report.service';
import { AdsReportController } from '../../presentation/controllers/ads-report.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdsReportController],
  providers: [AdsReportService],
  exports: [AdsReportService],
})
export class AdsReportModule {}
```

### Step 7: Create Backend Controller

Create `backend/src/presentation/controllers/ads-report.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { AdsReportService } from '../../modules/ads-report/ads-report.service.js';
import {
  CreateAdsReportDto,
  AdsReportQueryDto,
  AdsReportResponse,
  AdsReportSummary,
} from '../../application/dto/ads-report.dto.js';

@Controller('projects/:projectId/ads-reports')
@UseGuards(JwtAuthGuard)
export class AdsReportController {
  constructor(private readonly adsReportService: AdsReportService) {}

  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportResponse[]> {
    return this.adsReportService.list(projectId, query);
  }

  @Get('summary')
  async summary(
    @Param('projectId') projectId: string,
    @Query() query: AdsReportQueryDto,
  ): Promise<AdsReportSummary> {
    return this.adsReportService.summary(projectId, query);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAdsReportDto,
    @Req() req: { user: { sub: string } },
  ): Promise<AdsReportResponse> {
    return this.adsReportService.create(projectId, req.user.sub, dto);
  }
}
```

### Step 8: Add Zapier Webhook to Integration Controller

In `backend/src/presentation/controllers/integration.controller.ts`, add:

```typescript
interface ZapierAdsPayload {
  projectCode: string;
  period: string;
  reportDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: string;
  campaignName?: string;
}

@Post('webhook/ads-report')
async handleZapierAdsReport(
  @Headers('x-zapier-api-key') apiKey: string,
  @Body() body: ZapierAdsPayload,
) {
  const expected = process.env.ZAPIER_WEBHOOK_SECRET;
  if (!expected || apiKey !== expected) {
    throw new BadRequestException('Invalid API key');
  }

  if (!body.projectCode || !body.platform || !body.reportDate) {
    throw new BadRequestException('Missing required fields: projectCode, platform, reportDate');
  }

  const project = await this.prisma.project.findUnique({
    where: { code: body.projectCode },
    select: { id: true },
  });
  if (!project) throw new BadRequestException('Project not found');

  const systemUserId =
    process.env.SYSTEM_USER_ID ||
    (await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } }))?.id;
  if (!systemUserId) throw new BadRequestException('No system user configured');

  await this.prisma.adsReport.create({
    data: {
      projectId: project.id,
      period: body.period as any || 'DAILY',
      reportDate: new Date(body.reportDate),
      impressions: body.impressions || 0,
      clicks: body.clicks || 0,
      ctr: body.ctr || 0,
      cpc: body.cpc || 0,
      cpm: body.cpm || 0,
      cpa: body.cpa || 0,
      conversions: body.conversions || 0,
      roas: body.roas || 0,
      adSpend: body.adSpend || 0,
      platform: body.platform as any,
      campaignName: body.campaignName,
      source: 'ZAPIER',
      createdById: systemUserId,
    },
  });

  return { success: true };
}
```

Note: The `IntegrationController` route prefix is `integrations/pancake`. We need to either:
- Change the controller route to `integrations` and namespace existing pancake route, OR
- Create a new controller for Zapier webhooks at `integrations/zapier`

**Recommended:** Rename controller route to `integrations` and adjust methods:
```typescript
@Controller('integrations')
// existing: @Post('pancake/webhook')
// new:      @Post('webhook/ads-report')
```

### Step 9: Register Module

In `backend/src/main.ts` or `app.module.ts`, import `AdsReportModule`:

```typescript
import { AdsReportModule } from './modules/ads-report/ads-report.module';

@Module({
  imports: [
    // ... existing
    AdsReportModule,
  ],
})
```

### Step 10: Create Frontend API Client

Create `frontend/src/lib/api/ads-reports.ts`:

```typescript
import { api } from './index';

export type AdsReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type AdsPlatform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK' | 'OTHER';
export type AdsReportSource = 'MANUAL' | 'ZAPIER';

export const AdsPlatformLabels: Record<AdsPlatform, string> = {
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
  OTHER: 'Khac',
};

export const AdsReportPeriodLabels: Record<AdsReportPeriod, string> = {
  DAILY: 'Hang ngay',
  WEEKLY: 'Hang tuan',
  MONTHLY: 'Hang thang',
};

export interface AdsReport {
  id: string;
  projectId: string;
  period: AdsReportPeriod;
  reportDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: AdsPlatform;
  campaignName?: string | null;
  source: AdsReportSource;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface AdsReportSummary {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgCpc: number;
  totalConversions: number;
  avgRoas: number;
  totalAdSpend: number;
}

export interface CreateAdsReportInput {
  period: AdsReportPeriod;
  reportDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  adSpend: number;
  platform: AdsPlatform;
  campaignName?: string;
}

export interface AdsReportQuery {
  platform?: AdsPlatform;
  period?: AdsReportPeriod;
  startDate?: string;
  endDate?: string;
}

export const adsReportsApi = {
  list: async (projectId: string, query?: AdsReportQuery): Promise<AdsReport[]> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports`, { params: query });
    return data;
  },
  summary: async (projectId: string, query?: AdsReportQuery): Promise<AdsReportSummary> => {
    const { data } = await api.get(`/projects/${projectId}/ads-reports/summary`, { params: query });
    return data;
  },
  create: async (projectId: string, input: CreateAdsReportInput): Promise<AdsReport> => {
    const { data } = await api.post(`/projects/${projectId}/ads-reports`, input);
    return data;
  },
};
```

### Step 11: Create Frontend Hook

Create `frontend/src/hooks/use-ads-reports.ts`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsReportsApi, type AdsReport, type AdsReportSummary, type CreateAdsReportInput, type AdsReportQuery } from '@/lib/api/ads-reports';

export function useAdsReports(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReport[]>({
    queryKey: ['ads-reports', projectId, query],
    queryFn: () => adsReportsApi.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useAdsReportSummary(projectId: string, query?: AdsReportQuery) {
  return useQuery<AdsReportSummary>({
    queryKey: ['ads-report-summary', projectId, query],
    queryFn: () => adsReportsApi.summary(projectId, query),
    enabled: !!projectId,
  });
}

export function useCreateAdsReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdsReportInput) => adsReportsApi.create(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-reports', projectId] });
      qc.invalidateQueries({ queryKey: ['ads-report-summary', projectId] });
    },
  });
}
```

### Step 12: Create KPI Cards Component

Create `frontend/src/components/project/ads-kpi-cards.tsx`:

Row of 6 cards using existing `Card` component from shadcn. Each card:
- Icon (from lucide: Eye for impressions, MousePointer for clicks, Percent for CTR, DollarSign for CPC, Target for conversions, TrendingUp for ROAS)
- Value formatted (numbers with `.toLocaleString('vi-VN')`, percentages with `%`, currency with `d`)
- Label text

Uses `useAdsReportSummary` hook. Layout: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4`.

### Step 13: Create Trend Chart Component

Create `frontend/src/components/project/ads-trend-chart.tsx`:

recharts `LineChart` with `ResponsiveContainer`. Props: `reports: AdsReport[]`.

- X axis: `reportDate` formatted as `dd/MM`
- Lines: impressions (blue), clicks (green), conversions (orange)
- Tooltip with all values
- Legend below chart
- Toggle buttons above chart to switch between: Impressions/Clicks, CTR/CPC, Conversions/ROAS

Height 300px. Use Apple colors: blue=#0071e3, green=#34c759, orange=#ff9f0a.

### Step 14: Create Data Table Component

Create `frontend/src/components/project/ads-report-table.tsx`:

Table with columns: Date | Period | Platform | Campaign | Impressions | Clicks | CTR | CPC | Conversions | ROAS | Ad Spend | Source

Filters row above table:
- Platform select (All, Facebook, Google, TikTok, Other)
- Period select (All, Daily, Weekly, Monthly)
- Date range inputs

Uses shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`.

Source column shows badge: "Manual" (gray) or "Zapier" (blue).

### Step 15: Create Manual Input Dialog

Create `frontend/src/components/project/ads-report-modal.tsx`:

shadcn `Dialog` with form:
- Period select
- Report date input (date picker)
- Platform select
- Campaign name text input
- Number inputs: impressions, clicks, CTR, CPC, CPM, CPA, conversions, ROAS, ad spend

Grid layout: 3 columns for number fields. Submit calls `useCreateAdsReport`.

### Step 16: Add Ads Tab to Project Detail

In `frontend/src/app/dashboard/projects/[id]/page.tsx`:

1. Add `'ads'` to the `activeTab` state type union
2. Add to SegmentControl items: `{ value: 'ads', label: 'Bao cao Ads' }`
3. Add conditional render block:

```tsx
{activeTab === 'ads' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-subheadline font-semibold">Bao cao Quang cao</h3>
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdsModal(true)}>
        + Them bao cao
      </Button>
    </div>
    <AdsKpiCards projectId={projectId} />
    <AdsTrendChart projectId={projectId} />
    <AdsReportTable projectId={projectId} />
    <AdsReportModal projectId={projectId} open={showAdsModal} onOpenChange={setShowAdsModal} />
  </div>
)}
```

4. Add state: `const [showAdsModal, setShowAdsModal] = useState(false);`
5. Add imports for all 4 new components

### Step 17: Update Types

In `frontend/src/types/index.ts`, add:

```typescript
// ADS REPORT
export enum AdsReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum AdsPlatform {
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
  TIKTOK = 'TIKTOK',
  OTHER = 'OTHER',
}

export enum AdsReportSource {
  MANUAL = 'MANUAL',
  ZAPIER = 'ZAPIER',
}
```

## Todo List

- [x] Step 1: Add AdsReport enums to Prisma schema
- [x] Step 2: Add AdsReport model to Prisma schema + relations
- [x] Step 3: Generate and run Prisma migration
- [x] Step 4: Create backend DTOs (Create, Query, Response, Summary)
- [x] Step 5: Create backend AdsReportService
- [x] Step 6: Create backend AdsReportModule
- [x] Step 7: Create backend AdsReportController
- [x] Step 8: Add Zapier webhook to IntegrationController
- [x] Step 9: Register AdsReportModule in app module
- [x] Step 10: Create frontend API client (ads-reports.ts)
- [x] Step 11: Create frontend hook (use-ads-reports.ts)
- [x] Step 12: Create AdsKpiCards component
- [x] Step 13: Create AdsTrendChart component
- [x] Step 14: Create AdsReportTable component
- [x] Step 15: Create AdsReportModal component
- [x] Step 16: Add "Bao cao Ads" tab to project detail page
- [x] Step 17: Types defined in ads-reports.ts API client (no separate types file needed)

## Success Criteria

1. `npx prisma migrate dev` succeeds with AdsReport table
2. `POST /projects/:id/ads-reports` creates manual report; returns all fields
3. `GET /projects/:id/ads-reports` lists reports, filtered by platform/period/date
4. `GET /projects/:id/ads-reports/summary` returns aggregated KPIs
5. `POST /integrations/webhook/ads-report` with valid `x-zapier-api-key` header creates report with `source=ZAPIER`
6. Invalid API key returns 400
7. Frontend "Bao cao Ads" tab shows KPI cards, trend chart, data table
8. Manual input modal creates report and refreshes data
9. Filters (platform, period, date) work on both table and chart
10. Zapier-created records show "Zapier" badge in source column

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Zapier webhook schema changes | Data ingestion breaks | Validate all fields with defaults; log malformed payloads |
| High volume of daily Zapier calls | DB load | Add rate limiting middleware on webhook endpoint |
| CTR/CPC mismatch (auto-calc vs manual input) | Confusing data | Document that CTR/CPC in input are overrides; or auto-calculate from impressions/clicks/spend |
| Missing `AdsReport` relation on Project model | Prisma client error | Double-check relation added in schema before migration |
| IntegrationController route change breaks Pancake webhook | Existing integration breaks | Test existing Pancake route after refactor |

## Security Considerations

- Zapier webhook validates `x-zapier-api-key` header against `ZAPIER_WEBHOOK_SECRET` env var
- No JWT required for webhook (external service cannot authenticate); API key is sufficient
- Webhook endpoint should be rate-limited (e.g., 100 req/min)
- AdsReport CRUD endpoints protected by `JwtAuthGuard`
- Consider adding `@Roles()` guard to restrict report creation to PM/ADMIN/NVKD
- Env vars: `ZAPIER_WEBHOOK_SECRET` must be set in production; fail-closed if not set
- Sanitize `campaignName` string to prevent injection

## Next Steps

- Set up Zapier Zap: trigger from Google Sheets/Facebook Ads -> webhook to POST /integrations/webhook/ads-report
- Add CSV export for ads report data
- Consider adding comparison view (this period vs last period)
- Add platform-specific logo icons next to platform badges
