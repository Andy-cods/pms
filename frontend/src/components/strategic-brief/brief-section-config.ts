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

// =============================================
// 16 SECTION CONFIGS (Quy Trình 2 - Strategic Brief)
// =============================================

export const SECTION_CONFIGS: SectionConfig[] = [
  // 1. Objectives
  {
    sectionKey: 'objectives',
    fields: [
      { name: 'businessObjective', label: 'Mục tiêu kinh doanh', type: 'textarea', required: true, placeholder: 'VD: Tăng doanh thu 30% trong Q2' },
      { name: 'communicationObjective', label: 'Mục tiêu truyền thông', type: 'textarea', placeholder: 'VD: Tăng nhận diện thương hiệu 50%' },
      { name: 'marketingObjective', label: 'Mục tiêu marketing', type: 'textarea', placeholder: 'VD: Tăng leads 40%, giảm CPA 20%' },
      { name: 'primaryKPI', label: 'KPI chính', type: 'text', required: true, placeholder: 'VD: ROAS, CPA, Leads' },
      { name: 'secondaryKPI', label: 'KPI phụ', type: 'text', placeholder: 'VD: CTR, Engagement Rate' },
    ],
  },

  // 2. Market Research
  {
    sectionKey: 'market_research',
    fields: [
      { name: 'industryOverview', label: 'Tổng quan ngành', type: 'textarea', required: true },
      { name: 'industryTrends', label: 'Xu hướng ngành (mỗi dòng 1 xu hướng)', type: 'textarea', placeholder: 'VD:\nTrend 1\nTrend 2' },
      { name: 'ecommercePlatforms', label: 'Nền tảng e-commerce', type: 'textarea', placeholder: 'Shopee, Lazada, TikTok Shop...' },
      { name: 'keyInsights', label: 'Key Insights', type: 'textarea' },
      { name: 'userBehavior', label: 'Hành vi người dùng', type: 'textarea' },
      { name: 'priceSensitivity', label: 'Độ nhạy giá', type: 'text' },
      { name: 'strategicImplication', label: 'Hàm ý chiến lược', type: 'textarea' },
    ],
  },

  // 3. Customer Research - custom (personas + journey)
  {
    sectionKey: 'customer_research',
    fields: [],
    customComponent: 'customer-research',
  },

  // 4. Competitor Analysis - custom (competitor cards)
  {
    sectionKey: 'competitor_analysis',
    fields: [],
    customComponent: 'competitors',
  },

  // 5. Internal SWOT
  {
    sectionKey: 'internal_swot',
    fields: [
      { name: 'strengths', label: 'Điểm mạnh (Strengths)', type: 'textarea', required: true },
      { name: 'weaknesses', label: 'Điểm yếu (Weaknesses)', type: 'textarea', required: true },
      { name: 'resourceReality', label: 'Thực trạng nguồn lực', type: 'textarea' },
    ],
  },

  // 6. Strategic Recommendation
  {
    sectionKey: 'strategic_recommendation',
    fields: [
      { name: 'strategyStatement', label: 'Tuyên bố chiến lược', type: 'textarea', required: true, placeholder: 'VD: Tập trung vào funnel giữa để tối ưu conversion...' },
      { name: 'funnelStrategy', label: 'Chiến lược funnel', type: 'textarea', placeholder: 'Awareness → Consideration → Conversion' },
      { name: 'pillars', label: 'Trụ cột chiến lược (mỗi dòng 1 trụ cột)', type: 'textarea', placeholder: 'VD:\nContent Marketing\nPerformance Ads\nKOL Collaboration' },
    ],
  },

  // 7. Channel Strategy - custom (channel mix %)
  {
    sectionKey: 'channel_strategy',
    fields: [],
    customComponent: 'channel-strategy',
  },

  // 8. Creative Direction
  {
    sectionKey: 'creative_direction',
    fields: [
      { name: 'coreInsight', label: 'Core Insight', type: 'textarea', required: true },
      { name: 'keyMessage', label: 'Key Message', type: 'textarea', required: true },
      { name: 'toneOfVoice', label: 'Tone of Voice', type: 'text', placeholder: 'VD: Thân thiện, Chuyên nghiệp' },
      { name: 'preferredFormats', label: 'Định dạng ưu tiên (mỗi dòng 1 format)', type: 'textarea', placeholder: 'VD:\nShort-form video\nCarousel\nStatic image' },
    ],
  },

  // 9. Media & Execution
  {
    sectionKey: 'media_execution',
    fields: [
      { name: 'awarenessStrategy', label: 'Chiến lược Awareness', type: 'textarea', required: true },
      { name: 'leadStrategy', label: 'Chiến lược Lead/Conversion', type: 'textarea' },
      { name: 'retargetStrategy', label: 'Chiến lược Retarget', type: 'textarea' },
    ],
  },

  // 10. Timeline - custom (phases + milestones)
  {
    sectionKey: 'timeline',
    fields: [],
    customComponent: 'timeline',
  },

  // 11. Budget Logic - custom (allocation table)
  {
    sectionKey: 'budget_logic',
    fields: [],
    customComponent: 'budget-allocation',
  },

  // 12. KPI & Measurement - custom (targets table)
  {
    sectionKey: 'kpi_measurement',
    fields: [],
    customComponent: 'kpi-metrics',
  },

  // 13. Risk Mitigation - custom (risk pairs)
  {
    sectionKey: 'risk_mitigation',
    fields: [],
    customComponent: 'risk-mitigation',
  },

  // 14. Governance - custom (approval matrix)
  {
    sectionKey: 'governance',
    fields: [],
    customComponent: 'governance',
  },

  // 15. Planner Notes
  {
    sectionKey: 'planner_notes',
    fields: [
      { name: 'prerequisites', label: 'Điều kiện tiên quyết', type: 'textarea', placeholder: 'Các yêu cầu cần có trước khi bắt đầu...' },
      { name: 'specialNotes', label: 'Ghi chú đặc biệt', type: 'textarea', placeholder: 'Lưu ý quan trọng cho team...' },
    ],
  },

  // 16. Quotation
  {
    sectionKey: 'quotation',
    fields: [
      { name: 'quotationLink', label: 'Link báo giá', type: 'url', placeholder: 'https://docs.google.com/...' },
      { name: 'quotationStatus', label: 'Trạng thái', type: 'select', options: [
        { value: 'draft', label: 'Bản nháp' },
        { value: 'sent', label: 'Đã gửi khách' },
        { value: 'approved', label: 'Khách duyệt' },
        { value: 'rejected', label: 'Khách từ chối' },
      ] },
    ],
  },
];
