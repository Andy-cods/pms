import { ProjectPhaseType } from '@prisma/client';

export const DEFAULT_PHASES = [
  {
    phaseType: ProjectPhaseType.KHOI_TAO_PLAN,
    name: 'Khởi tạo & Lập kế hoạch',
    weight: 50,
    orderIndex: 0,
    defaultItems: [
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
    defaultItems: [
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
    defaultItems: [
      { name: 'Performance & Reporting', weight: 30, orderIndex: 0 },
    ],
  },
  {
    phaseType: ProjectPhaseType.TONG_KET,
    name: 'Tổng kết',
    weight: 10,
    orderIndex: 3,
    defaultItems: [
      { name: 'Closure & BBNT', weight: 10, orderIndex: 0 },
    ],
  },
];
