export const BRIEF_SECTIONS = [
  { num: 1, key: 'objectives', title: 'Mục tiêu chiến dịch' },
  { num: 2, key: 'market_research', title: 'Nghiên cứu thị trường' },
  { num: 3, key: 'customer_research', title: 'Nghiên cứu khách hàng' },
  { num: 4, key: 'competitor_analysis', title: 'Phân tích đối thủ' },
  { num: 5, key: 'internal_swot', title: 'SWOT nội bộ' },
  { num: 6, key: 'strategic_recommendation', title: 'Đề xuất chiến lược' },
  { num: 7, key: 'channel_strategy', title: 'Chiến lược kênh' },
  { num: 8, key: 'creative_direction', title: 'Định hướng sáng tạo' },
  { num: 9, key: 'media_execution', title: 'Media & Execution Logic' },
  { num: 10, key: 'timeline', title: 'Timeline' },
  { num: 11, key: 'budget_logic', title: 'Budget Logic' },
  { num: 12, key: 'kpi_measurement', title: 'KPI & Measurement' },
  { num: 13, key: 'risk_mitigation', title: 'Rủi ro & Giải pháp' },
  { num: 14, key: 'governance', title: 'Governance' },
  { num: 15, key: 'planner_notes', title: 'Ghi chú Planner' },
  { num: 16, key: 'quotation', title: 'Báo giá' },
] as const;

export const TOTAL_SECTIONS = BRIEF_SECTIONS.length;
