export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'url';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface SectionConfig {
  sectionKey: string;
  fields: FieldConfig[];
  customComponent?: string;
}

export const SECTION_CONFIGS: SectionConfig[] = [
  {
    sectionKey: 'brand_overview',
    fields: [
      { name: 'brandName', label: 'Tên thương hiệu', type: 'text', required: true },
      { name: 'brandDescription', label: 'Mô tả', type: 'textarea' },
      { name: 'brandValues', label: 'Giá trị cốt lõi', type: 'textarea' },
      { name: 'brandTone', label: 'Tone of voice', type: 'text' },
    ],
  },
  {
    sectionKey: 'market_analysis',
    fields: [
      { name: 'marketOverview', label: 'Tổng quan thị trường', type: 'textarea', required: true },
      { name: 'marketTrends', label: 'Xu hướng', type: 'textarea' },
      { name: 'marketChallenges', label: 'Thách thức', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'target_audience',
    fields: [
      { name: 'demographics', label: 'Demographics', type: 'textarea', required: true },
      { name: 'psychographics', label: 'Psychographics', type: 'textarea' },
      { name: 'behaviors', label: 'Behaviors', type: 'textarea' },
      { name: 'painPoints', label: 'Pain points', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'campaign_objectives',
    fields: [
      { name: 'primaryObjective', label: 'Mục tiêu chính', type: 'textarea', required: true },
      { name: 'secondaryObjectives', label: 'Mục tiêu phụ', type: 'textarea' },
      { name: 'successMetrics', label: 'Chỉ số thành công', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'key_messages',
    fields: [
      { name: 'mainMessage', label: 'Thông điệp chính', type: 'textarea', required: true },
      { name: 'supportingMessages', label: 'Thông điệp hỗ trợ', type: 'textarea' },
      { name: 'callToAction', label: 'CTA', type: 'text' },
    ],
  },
  {
    sectionKey: 'creative_direction',
    fields: [
      { name: 'visualStyle', label: 'Phong cách hình ảnh', type: 'textarea' },
      { name: 'colorPalette', label: 'Bảng màu', type: 'text' },
      { name: 'references', label: 'Tham khảo', type: 'textarea' },
      { name: 'guidelines', label: 'Lưu ý', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'media_strategy',
    fields: [
      { name: 'channels', label: 'Kênh truyền thông', type: 'textarea', required: true },
      { name: 'approach', label: 'Cách tiếp cận', type: 'textarea' },
      { name: 'frequency', label: 'Tần suất', type: 'text' },
    ],
  },
  {
    sectionKey: 'content_strategy',
    fields: [
      { name: 'contentPillars', label: 'Content Pillars', type: 'textarea', required: true },
      { name: 'contentTypes', label: 'Loại nội dung', type: 'textarea' },
      { name: 'postingSchedule', label: 'Lịch đăng bài', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'kol_influencer',
    fields: [
      { name: 'kolStrategy', label: 'Chiến lược KOL', type: 'textarea' },
      { name: 'targetKOLs', label: 'KOL mục tiêu', type: 'textarea' },
      { name: 'kolBudget', label: 'Ngân sách KOL', type: 'number' },
    ],
  },
  { sectionKey: 'budget_allocation', fields: [], customComponent: 'budget-allocation' },
  { sectionKey: 'timeline', fields: [], customComponent: 'timeline' },
  { sectionKey: 'kpi_metrics', fields: [], customComponent: 'kpi-metrics' },
  { sectionKey: 'competitors', fields: [], customComponent: 'competitors' },
  {
    sectionKey: 'deliverables',
    fields: [
      { name: 'deliverableList', label: 'Danh sách sản phẩm', type: 'textarea', required: true },
      { name: 'format', label: 'Định dạng', type: 'text' },
      { name: 'quantity', label: 'Số lượng', type: 'text' },
    ],
  },
  {
    sectionKey: 'approval_process',
    fields: [
      { name: 'approvalSteps', label: 'Các bước duyệt', type: 'textarea' },
      { name: 'stakeholders', label: 'Người liên quan', type: 'textarea' },
      { name: 'revisionPolicy', label: 'Chính sách sửa đổi', type: 'textarea' },
    ],
  },
  {
    sectionKey: 'additional_notes',
    fields: [
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
      { name: 'attachments', label: 'Đính kèm (links)', type: 'textarea' },
    ],
  },
];
