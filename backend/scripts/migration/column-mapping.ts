/**
 * BC Agency PMS - Excel to Database Column Mapping
 * Maps Excel columns (46 sheets, 135 columns) to Prisma schema fields
 */

// ============================================
// ENUM MAPPINGS
// ============================================

export const UserRoleMapping: Record<string, string> = {
  'super admin': 'SUPER_ADMIN',
  'superadmin': 'SUPER_ADMIN',
  'admin': 'ADMIN',
  'technical': 'TECHNICAL',
  'ky thuat': 'TECHNICAL',
  'nvkd': 'NVKD',
  'sales': 'NVKD',
  'kinh doanh': 'NVKD',
  'pm': 'PM',
  'project manager': 'PM',
  'quan ly du an': 'PM',
  'planner': 'PLANNER',
  'ke hoach': 'PLANNER',
  'account': 'ACCOUNT',
  'content': 'CONTENT',
  'noi dung': 'CONTENT',
  'design': 'DESIGN',
  'thiet ke': 'DESIGN',
  'media': 'MEDIA',
};

export const ProjectStatusMapping: Record<string, string> = {
  'stable': 'STABLE',
  'on dat': 'STABLE',
  'green': 'STABLE',
  'xanh': 'STABLE',
  'warning': 'WARNING',
  'at risk': 'WARNING',
  'yellow': 'WARNING',
  'vang': 'WARNING',
  'critical': 'CRITICAL',
  'delayed': 'CRITICAL',
  'red': 'CRITICAL',
  'do': 'CRITICAL',
};

export const ProjectStageMapping: Record<string, string> = {
  'intake': 'INTAKE',
  'tiep nhan': 'INTAKE',
  'tiep nhan brief': 'INTAKE',
  'discovery': 'DISCOVERY',
  'discovery & audit': 'DISCOVERY',
  'audit': 'DISCOVERY',
  'planning': 'PLANNING',
  'lap ke hoach': 'PLANNING',
  'ke hoach': 'PLANNING',
  'under review': 'UNDER_REVIEW',
  'cho duyet': 'UNDER_REVIEW',
  'review': 'UNDER_REVIEW',
  'proposal': 'PROPOSAL_PITCH',
  'pitch': 'PROPOSAL_PITCH',
  'proposal/pitch': 'PROPOSAL_PITCH',
  'ongoing': 'ONGOING',
  'dang trien khai': 'ONGOING',
  'trien khai': 'ONGOING',
  'in progress': 'ONGOING',
  'optimization': 'OPTIMIZATION',
  'toi uu': 'OPTIMIZATION',
  'completed': 'COMPLETED',
  'hoan thanh': 'COMPLETED',
  'done': 'COMPLETED',
  'closed': 'CLOSED',
  'dong': 'CLOSED',
};

export const TaskStatusMapping: Record<string, string> = {
  'todo': 'TODO',
  'chua lam': 'TODO',
  'to do': 'TODO',
  'in progress': 'IN_PROGRESS',
  'dang lam': 'IN_PROGRESS',
  'doing': 'IN_PROGRESS',
  'review': 'REVIEW',
  'dang review': 'REVIEW',
  'done': 'DONE',
  'hoan thanh': 'DONE',
  'completed': 'DONE',
  'blocked': 'BLOCKED',
  'bi chan': 'BLOCKED',
  'cancelled': 'CANCELLED',
  'huy': 'CANCELLED',
  'cancel': 'CANCELLED',
};

export const TaskPriorityMapping: Record<string, string> = {
  'low': 'LOW',
  'thap': 'LOW',
  'medium': 'MEDIUM',
  'trung binh': 'MEDIUM',
  'normal': 'MEDIUM',
  'high': 'HIGH',
  'cao': 'HIGH',
  'urgent': 'URGENT',
  'khan cap': 'URGENT',
  'gap': 'URGENT',
};

export const FileCategoryMapping: Record<string, string> = {
  'brief': 'BRIEF',
  'plan': 'PLAN',
  'ke hoach': 'PLAN',
  'proposal': 'PROPOSAL',
  'de xuat': 'PROPOSAL',
  'report': 'REPORT',
  'bao cao': 'REPORT',
  'creative': 'CREATIVE',
  'sang tao': 'CREATIVE',
  'raw data': 'RAW_DATA',
  'du lieu': 'RAW_DATA',
  'contract': 'CONTRACT',
  'hop dong': 'CONTRACT',
  'other': 'OTHER',
  'khac': 'OTHER',
};

// ============================================
// COLUMN MAPPINGS - Excel to Database Fields
// ============================================

export interface ColumnMapping {
  excelColumn: string;
  dbField: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'decimal' | 'json' | 'enum' | 'array';
  required: boolean;
  enumMapping?: Record<string, string>;
  transform?: (value: unknown) => unknown;
  defaultValue?: unknown;
}

// ============================================
// USER COLUMN MAPPINGS
// ============================================
export const UserColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Email', dbField: 'email', type: 'string', required: true },
  { excelColumn: 'Ho Ten', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Name', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Ten', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Mat Khau', dbField: 'password', type: 'string', required: false, defaultValue: 'changeme123' },
  { excelColumn: 'Password', dbField: 'password', type: 'string', required: false, defaultValue: 'changeme123' },
  { excelColumn: 'Vai Tro', dbField: 'role', type: 'enum', required: true, enumMapping: UserRoleMapping },
  { excelColumn: 'Role', dbField: 'role', type: 'enum', required: true, enumMapping: UserRoleMapping },
  { excelColumn: 'Chuc Vu', dbField: 'role', type: 'enum', required: true, enumMapping: UserRoleMapping },
  { excelColumn: 'Active', dbField: 'isActive', type: 'boolean', required: false, defaultValue: true },
  { excelColumn: 'Trang Thai', dbField: 'isActive', type: 'boolean', required: false, defaultValue: true },
  { excelColumn: 'Avatar', dbField: 'avatar', type: 'string', required: false },
];

// ============================================
// CLIENT COLUMN MAPPINGS
// ============================================
export const ClientColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Ten Cong Ty', dbField: 'companyName', type: 'string', required: true },
  { excelColumn: 'Company Name', dbField: 'companyName', type: 'string', required: true },
  { excelColumn: 'Cong Ty', dbField: 'companyName', type: 'string', required: true },
  { excelColumn: 'Ten Khach Hang', dbField: 'companyName', type: 'string', required: true },
  { excelColumn: 'Nguoi Lien He', dbField: 'contactName', type: 'string', required: false },
  { excelColumn: 'Contact Name', dbField: 'contactName', type: 'string', required: false },
  { excelColumn: 'Lien He', dbField: 'contactName', type: 'string', required: false },
  { excelColumn: 'Email', dbField: 'contactEmail', type: 'string', required: false },
  { excelColumn: 'Email Lien He', dbField: 'contactEmail', type: 'string', required: false },
  { excelColumn: 'So Dien Thoai', dbField: 'contactPhone', type: 'string', required: false },
  { excelColumn: 'Phone', dbField: 'contactPhone', type: 'string', required: false },
  { excelColumn: 'SDT', dbField: 'contactPhone', type: 'string', required: false },
  { excelColumn: 'Ma Truy Cap', dbField: 'accessCode', type: 'string', required: true },
  { excelColumn: 'Access Code', dbField: 'accessCode', type: 'string', required: true },
  { excelColumn: 'Active', dbField: 'isActive', type: 'boolean', required: false, defaultValue: true },
];

// ============================================
// PROJECT COLUMN MAPPINGS
// ============================================
export const ProjectColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Ma Du An', dbField: 'code', type: 'string', required: true },
  { excelColumn: 'Project Code', dbField: 'code', type: 'string', required: true },
  { excelColumn: 'Code', dbField: 'code', type: 'string', required: true },
  { excelColumn: 'Ma', dbField: 'code', type: 'string', required: true },
  { excelColumn: 'Ten Du An', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Project Name', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Ten', dbField: 'name', type: 'string', required: true },
  { excelColumn: 'Mo Ta', dbField: 'description', type: 'string', required: false },
  { excelColumn: 'Description', dbField: 'description', type: 'string', required: false },
  { excelColumn: 'Loai San Pham', dbField: 'productType', type: 'string', required: false },
  { excelColumn: 'Product Type', dbField: 'productType', type: 'string', required: false },
  { excelColumn: 'Trang Thai', dbField: 'status', type: 'enum', required: false, enumMapping: ProjectStatusMapping, defaultValue: 'STABLE' },
  { excelColumn: 'Status', dbField: 'status', type: 'enum', required: false, enumMapping: ProjectStatusMapping, defaultValue: 'STABLE' },
  { excelColumn: 'Giai Doan', dbField: 'stage', type: 'enum', required: false, enumMapping: ProjectStageMapping, defaultValue: 'INTAKE' },
  { excelColumn: 'Stage', dbField: 'stage', type: 'enum', required: false, enumMapping: ProjectStageMapping, defaultValue: 'INTAKE' },
  { excelColumn: 'Tien Do Giai Doan', dbField: 'stageProgress', type: 'number', required: false, defaultValue: 0 },
  { excelColumn: 'Stage Progress', dbField: 'stageProgress', type: 'number', required: false, defaultValue: 0 },
  { excelColumn: 'Ngay Bat Dau', dbField: 'startDate', type: 'date', required: false },
  { excelColumn: 'Start Date', dbField: 'startDate', type: 'date', required: false },
  { excelColumn: 'Bat Dau', dbField: 'startDate', type: 'date', required: false },
  { excelColumn: 'Ngay Ket Thuc', dbField: 'endDate', type: 'date', required: false },
  { excelColumn: 'End Date', dbField: 'endDate', type: 'date', required: false },
  { excelColumn: 'Ket Thuc', dbField: 'endDate', type: 'date', required: false },
  { excelColumn: 'Tien Do Timeline', dbField: 'timelineProgress', type: 'number', required: false, defaultValue: 0 },
  { excelColumn: 'Timeline Progress', dbField: 'timelineProgress', type: 'number', required: false, defaultValue: 0 },
  { excelColumn: 'Khach Hang', dbField: '_clientName', type: 'string', required: false }, // Will be resolved to clientId
  { excelColumn: 'Client', dbField: '_clientName', type: 'string', required: false },
  { excelColumn: 'Drive Link', dbField: 'driveLink', type: 'string', required: false },
  { excelColumn: 'Link Drive', dbField: 'driveLink', type: 'string', required: false },
  { excelColumn: 'Plan Link', dbField: 'planLink', type: 'string', required: false },
  { excelColumn: 'Link Ke Hoach', dbField: 'planLink', type: 'string', required: false },
  { excelColumn: 'Tracking Link', dbField: 'trackingLink', type: 'string', required: false },
  { excelColumn: 'Link Tracking', dbField: 'trackingLink', type: 'string', required: false },
];

// ============================================
// PROJECT BUDGET COLUMN MAPPINGS
// ============================================
export const ProjectBudgetColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Ma Du An', dbField: '_projectCode', type: 'string', required: true }, // Will be resolved to projectId
  { excelColumn: 'Project Code', dbField: '_projectCode', type: 'string', required: true },
  { excelColumn: 'Tong Ngan Sach', dbField: 'totalBudget', type: 'decimal', required: true },
  { excelColumn: 'Total Budget', dbField: 'totalBudget', type: 'decimal', required: true },
  { excelColumn: 'Budget', dbField: 'totalBudget', type: 'decimal', required: true },
  { excelColumn: 'Ngan Sach Thang', dbField: 'monthlyBudget', type: 'decimal', required: false },
  { excelColumn: 'Monthly Budget', dbField: 'monthlyBudget', type: 'decimal', required: false },
  { excelColumn: 'Da Chi Tieu', dbField: 'spentAmount', type: 'decimal', required: false, defaultValue: 0 },
  { excelColumn: 'Spent', dbField: 'spentAmount', type: 'decimal', required: false, defaultValue: 0 },
  { excelColumn: 'Spent Amount', dbField: 'spentAmount', type: 'decimal', required: false, defaultValue: 0 },
  { excelColumn: 'Phi Quang Cao', dbField: 'fixedAdFee', type: 'decimal', required: false },
  { excelColumn: 'Fixed Ad Fee', dbField: 'fixedAdFee', type: 'decimal', required: false },
  { excelColumn: 'Phi DV Quang Cao', dbField: 'adServiceFee', type: 'decimal', required: false },
  { excelColumn: 'Ad Service Fee', dbField: 'adServiceFee', type: 'decimal', required: false },
  { excelColumn: 'Phi Content', dbField: 'contentFee', type: 'decimal', required: false },
  { excelColumn: 'Content Fee', dbField: 'contentFee', type: 'decimal', required: false },
  { excelColumn: 'Phi Design', dbField: 'designFee', type: 'decimal', required: false },
  { excelColumn: 'Design Fee', dbField: 'designFee', type: 'decimal', required: false },
  { excelColumn: 'Phi Media', dbField: 'mediaFee', type: 'decimal', required: false },
  { excelColumn: 'Media Fee', dbField: 'mediaFee', type: 'decimal', required: false },
  { excelColumn: 'Phi Khac', dbField: 'otherFee', type: 'decimal', required: false },
  { excelColumn: 'Other Fee', dbField: 'otherFee', type: 'decimal', required: false },
  { excelColumn: 'Budget Pacing', dbField: 'budgetPacing', type: 'number', required: false },
];

// ============================================
// PROJECT KPI COLUMN MAPPINGS
// ============================================
export const ProjectKPIColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Ma Du An', dbField: '_projectCode', type: 'string', required: true },
  { excelColumn: 'Project Code', dbField: '_projectCode', type: 'string', required: true },
  { excelColumn: 'Loai KPI', dbField: 'kpiType', type: 'string', required: true },
  { excelColumn: 'KPI Type', dbField: 'kpiType', type: 'string', required: true },
  { excelColumn: 'Type', dbField: 'kpiType', type: 'string', required: true },
  { excelColumn: 'Gia Tri Muc Tieu', dbField: 'targetValue', type: 'number', required: false },
  { excelColumn: 'Target', dbField: 'targetValue', type: 'number', required: false },
  { excelColumn: 'Target Value', dbField: 'targetValue', type: 'number', required: false },
  { excelColumn: 'Gia Tri Thuc Te', dbField: 'actualValue', type: 'number', required: false },
  { excelColumn: 'Actual', dbField: 'actualValue', type: 'number', required: false },
  { excelColumn: 'Actual Value', dbField: 'actualValue', type: 'number', required: false },
  { excelColumn: 'Don Vi', dbField: 'unit', type: 'string', required: false },
  { excelColumn: 'Unit', dbField: 'unit', type: 'string', required: false },
];

// ============================================
// TASK COLUMN MAPPINGS
// ============================================
export const TaskColumnMappings: ColumnMapping[] = [
  { excelColumn: 'Ma Du An', dbField: '_projectCode', type: 'string', required: true },
  { excelColumn: 'Project Code', dbField: '_projectCode', type: 'string', required: true },
  { excelColumn: 'Tieu De', dbField: 'title', type: 'string', required: true },
  { excelColumn: 'Title', dbField: 'title', type: 'string', required: true },
  { excelColumn: 'Ten Task', dbField: 'title', type: 'string', required: true },
  { excelColumn: 'Task Name', dbField: 'title', type: 'string', required: true },
  { excelColumn: 'Mo Ta', dbField: 'description', type: 'string', required: false },
  { excelColumn: 'Description', dbField: 'description', type: 'string', required: false },
  { excelColumn: 'Trang Thai', dbField: 'status', type: 'enum', required: false, enumMapping: TaskStatusMapping, defaultValue: 'TODO' },
  { excelColumn: 'Status', dbField: 'status', type: 'enum', required: false, enumMapping: TaskStatusMapping, defaultValue: 'TODO' },
  { excelColumn: 'Muc Do Uu Tien', dbField: 'priority', type: 'enum', required: false, enumMapping: TaskPriorityMapping, defaultValue: 'MEDIUM' },
  { excelColumn: 'Priority', dbField: 'priority', type: 'enum', required: false, enumMapping: TaskPriorityMapping, defaultValue: 'MEDIUM' },
  { excelColumn: 'Do Uu Tien', dbField: 'priority', type: 'enum', required: false, enumMapping: TaskPriorityMapping, defaultValue: 'MEDIUM' },
  { excelColumn: 'Gio Du Kien', dbField: 'estimatedHours', type: 'number', required: false },
  { excelColumn: 'Estimated Hours', dbField: 'estimatedHours', type: 'number', required: false },
  { excelColumn: 'Gio Thuc Te', dbField: 'actualHours', type: 'number', required: false },
  { excelColumn: 'Actual Hours', dbField: 'actualHours', type: 'number', required: false },
  { excelColumn: 'Han Chot', dbField: 'deadline', type: 'date', required: false },
  { excelColumn: 'Deadline', dbField: 'deadline', type: 'date', required: false },
  { excelColumn: 'Due Date', dbField: 'deadline', type: 'date', required: false },
  { excelColumn: 'Bat Dau Luc', dbField: 'startedAt', type: 'date', required: false },
  { excelColumn: 'Started At', dbField: 'startedAt', type: 'date', required: false },
  { excelColumn: 'Hoan Thanh Luc', dbField: 'completedAt', type: 'date', required: false },
  { excelColumn: 'Completed At', dbField: 'completedAt', type: 'date', required: false },
  { excelColumn: 'Nguoi Phu Trach', dbField: '_assigneeEmails', type: 'string', required: false }, // Comma-separated, will be resolved
  { excelColumn: 'Assignee', dbField: '_assigneeEmails', type: 'string', required: false },
  { excelColumn: 'Assignees', dbField: '_assigneeEmails', type: 'string', required: false },
  { excelColumn: 'Nguoi Review', dbField: '_reviewerEmail', type: 'string', required: false },
  { excelColumn: 'Reviewer', dbField: '_reviewerEmail', type: 'string', required: false },
  { excelColumn: 'Nguoi Tao', dbField: '_creatorEmail', type: 'string', required: true },
  { excelColumn: 'Created By', dbField: '_creatorEmail', type: 'string', required: true },
  { excelColumn: 'Creator', dbField: '_creatorEmail', type: 'string', required: true },
  { excelColumn: 'Thu Tu', dbField: 'orderIndex', type: 'number', required: false, defaultValue: 0 },
  { excelColumn: 'Order', dbField: 'orderIndex', type: 'number', required: false, defaultValue: 0 },
];

// ============================================
// SHEET TO ENTITY MAPPING
// ============================================
export interface SheetMapping {
  sheetNames: string[]; // Possible sheet names (Vietnamese/English)
  entity: string;
  columnMappings: ColumnMapping[];
  orderPriority: number; // Lower = import first (for dependencies)
}

export const SheetMappings: SheetMapping[] = [
  {
    sheetNames: ['Users', 'Nguoi Dung', 'NhanVien', 'Staff', 'Employees'],
    entity: 'User',
    columnMappings: UserColumnMappings,
    orderPriority: 1,
  },
  {
    sheetNames: ['Clients', 'Khach Hang', 'KhachHang', 'Customers'],
    entity: 'Client',
    columnMappings: ClientColumnMappings,
    orderPriority: 2,
  },
  {
    sheetNames: ['Projects', 'Du An', 'DuAn', 'Project List'],
    entity: 'Project',
    columnMappings: ProjectColumnMappings,
    orderPriority: 3,
  },
  {
    sheetNames: ['Project Budget', 'Ngan Sach', 'NganSach', 'Budget'],
    entity: 'ProjectBudget',
    columnMappings: ProjectBudgetColumnMappings,
    orderPriority: 4,
  },
  {
    sheetNames: ['Project KPI', 'KPI', 'ChiSoKPI'],
    entity: 'ProjectKPI',
    columnMappings: ProjectKPIColumnMappings,
    orderPriority: 5,
  },
  {
    sheetNames: ['Tasks', 'Cong Viec', 'CongViec', 'Task List'],
    entity: 'Task',
    columnMappings: TaskColumnMappings,
    orderPriority: 6,
  },
];

// ============================================
// DATA TYPE CONVERTERS
// ============================================

export function normalizeString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function normalizeDecimal(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return num.toFixed(2);
}

export function normalizeBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  const strVal = String(value).toLowerCase().trim();
  return ['true', '1', 'yes', 'y', 'co', 'active', 'enabled'].includes(strVal);
}

export function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  // If it's already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial date conversion
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }

  // If it's a string, try various formats
  const strVal = String(value).trim();

  // Common date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = strVal.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (format === formats[1]) { // YYYY-MM-DD
        [, year, month, day] = match.map(Number);
      } else { // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match.map(Number);
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try native parsing as fallback
  const date = new Date(strVal);
  return isNaN(date.getTime()) ? null : date;
}

export function normalizeEnum(
  value: unknown,
  enumMapping: Record<string, string>,
  defaultValue?: string
): string | null {
  if (value === null || value === undefined || value === '') {
    return defaultValue || null;
  }

  const strVal = String(value).toLowerCase().trim();

  // Direct match
  if (enumMapping[strVal]) {
    return enumMapping[strVal];
  }

  // Check if value is already a valid enum value
  const enumValues = Object.values(enumMapping);
  if (enumValues.includes(strVal.toUpperCase())) {
    return strVal.toUpperCase();
  }

  return defaultValue || null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function findMatchingMapping(
  columnHeader: string,
  mappings: ColumnMapping[]
): ColumnMapping | undefined {
  const normalizedHeader = columnHeader.toLowerCase().trim();

  return mappings.find(m =>
    m.excelColumn.toLowerCase().trim() === normalizedHeader
  );
}

export function getRequiredFieldsForEntity(mappings: ColumnMapping[]): string[] {
  const requiredFields = new Set<string>();

  for (const mapping of mappings) {
    if (mapping.required) {
      requiredFields.add(mapping.dbField);
    }
  }

  return Array.from(requiredFields);
}

export function mapRowToEntity(
  row: Record<string, unknown>,
  mappings: ColumnMapping[]
): Record<string, unknown> {
  const entity: Record<string, unknown> = {};

  for (const [columnHeader, value] of Object.entries(row)) {
    const mapping = findMatchingMapping(columnHeader, mappings);

    if (!mapping) continue;

    let convertedValue: unknown;

    switch (mapping.type) {
      case 'string':
        convertedValue = normalizeString(value);
        break;
      case 'number':
        convertedValue = normalizeNumber(value);
        break;
      case 'decimal':
        convertedValue = normalizeDecimal(value);
        break;
      case 'boolean':
        convertedValue = normalizeBoolean(value);
        break;
      case 'date':
        convertedValue = normalizeDate(value);
        break;
      case 'enum':
        convertedValue = normalizeEnum(value, mapping.enumMapping || {}, mapping.defaultValue as string);
        break;
      case 'json':
        convertedValue = value;
        break;
      case 'array':
        convertedValue = normalizeString(value)?.split(',').map(s => s.trim()) || [];
        break;
      default:
        convertedValue = value;
    }

    // Apply custom transform if exists
    if (mapping.transform && convertedValue !== null) {
      convertedValue = mapping.transform(convertedValue);
    }

    // Use default value if converted value is null
    if (convertedValue === null && mapping.defaultValue !== undefined) {
      convertedValue = mapping.defaultValue;
    }

    entity[mapping.dbField] = convertedValue;
  }

  return entity;
}
