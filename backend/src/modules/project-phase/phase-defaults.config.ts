import { ProjectPhaseType } from '@prisma/client';

export const DEFAULT_PHASES = [
  {
    phaseType: ProjectPhaseType.KHOI_TAO_PLAN,
    name: 'Khởi tạo & Lập kế hoạch',
    weight: 50,
    orderIndex: 0,
    defaultItems: [
      { name: 'Intake & Brief', weight: 5, orderIndex: 0,
        pic: 'Sale', support: 'Leader/Team MKT', expectedOutput: 'Brief hoàn chỉnh' },
      { name: 'Discovery & Audit', weight: 5, orderIndex: 1,
        pic: 'Sale/Leader', support: 'Account/Planner', expectedOutput: 'Audit report' },
      { name: 'Proposal & Presentation', weight: 25, orderIndex: 2,
        pic: 'Planner', support: 'Account/Team', expectedOutput: 'Proposal deck' },
      { name: 'Pitching Round', weight: 15, orderIndex: 3,
        pic: 'Sale', support: 'Account/Planner', expectedOutput: 'Client approval' },
    ],
  },
  {
    phaseType: ProjectPhaseType.SETUP_CHUAN_BI,
    name: 'Setup & Chuẩn bị',
    weight: 10,
    orderIndex: 1,
    defaultItems: [
      { name: 'Internal Kick-off', weight: 2, orderIndex: 0,
        pic: 'Planner', support: 'Team', expectedOutput: 'Kick-off notes' },
      { name: 'Client Kick-off', weight: 2, orderIndex: 1,
        pic: 'Sale', support: 'Account/Team', expectedOutput: 'Meeting minutes' },
      { name: 'Campaign Planning & Setup', weight: 6, orderIndex: 2,
        pic: 'Media/Creative', support: 'Account', expectedOutput: 'Campaign setup complete' },
    ],
  },
  {
    phaseType: ProjectPhaseType.VAN_HANH_TOI_UU,
    name: 'Vận hành & Tối ưu',
    weight: 30,
    orderIndex: 2,
    defaultItems: [
      { name: 'Realtime Dashboard', weight: 7.5, orderIndex: 0,
        pic: 'Media', support: 'Planner', expectedOutput: 'Dashboard live' },
      { name: 'Data Analysis', weight: 7.5, orderIndex: 1,
        pic: 'Account', support: 'Planner', expectedOutput: 'Analysis report' },
      { name: 'Weekly Sync', weight: 7.5, orderIndex: 2,
        pic: 'Account', support: 'Sale', expectedOutput: 'Weekly report' },
      { name: 'Client Reporting', weight: 7.5, orderIndex: 3,
        pic: 'Account', support: 'Team', expectedOutput: 'Client report' },
    ],
  },
  {
    phaseType: ProjectPhaseType.TONG_KET,
    name: 'Tổng kết',
    weight: 10,
    orderIndex: 3,
    defaultItems: [
      { name: 'Performance Review', weight: 5, orderIndex: 0,
        pic: 'Media', support: 'Planner', expectedOutput: 'Review report' },
      { name: 'BBNT & Renewal', weight: 5, orderIndex: 1,
        pic: 'Planner', support: 'Account', expectedOutput: 'BBNT signed' },
    ],
  },
];
