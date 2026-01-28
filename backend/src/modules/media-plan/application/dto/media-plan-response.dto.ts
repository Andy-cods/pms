export interface MediaPlanItemResponseDto {
  id: string;
  mediaPlanId: string;
  channel: string;
  campaignType: string;
  objective: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetReach: number | null;
  targetClicks: number | null;
  targetLeads: number | null;
  targetCPL: number | null;
  targetCPC: number | null;
  targetROAS: number | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPlanResponseDto {
  id: string;
  projectId: string;
  name: string;
  type: string;
  month: number;
  year: number;
  version: number;
  status: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  items: MediaPlanItemResponseDto[];
  itemCount: number;
  allocatedBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPlanListResponseDto {
  data: MediaPlanResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
