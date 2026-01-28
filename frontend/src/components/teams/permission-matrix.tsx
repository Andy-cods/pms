'use client';

import { Badge } from '@/components/ui/badge';
import { UserRole, UserRoleLabels } from '@/types';

type Permission = 'W' | 'R' | '-';

const FEATURES = [
  'Dự án',
  'Tasks',
  'Ngân sách',
  'Báo cáo',
  'Teams',
  'Phê duyệt',
] as const;

const ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PM,
  UserRole.NVKD,
  UserRole.PLANNER,
  UserRole.ACCOUNT,
  UserRole.CONTENT,
  UserRole.DESIGN,
  UserRole.MEDIA,
  UserRole.TECHNICAL,
];

const PERMISSIONS: Record<string, Record<UserRole, Permission>> = {
  'Dự án': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: 'R',
    ACCOUNT: 'R', CONTENT: 'R', DESIGN: 'R', MEDIA: 'R', TECHNICAL: 'R',
  },
  'Tasks': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'R', PLANNER: 'W',
    ACCOUNT: 'W', CONTENT: 'W', DESIGN: 'W', MEDIA: 'W', TECHNICAL: 'W',
  },
  'Ngân sách': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: 'R',
    ACCOUNT: 'R', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-',
  },
  'Báo cáo': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'R', NVKD: 'R', PLANNER: '-',
    ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-',
  },
  'Teams': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'R', NVKD: '-', PLANNER: '-',
    ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-',
  },
  'Phê duyệt': {
    SUPER_ADMIN: 'W', ADMIN: 'W', PM: 'W', NVKD: 'W', PLANNER: '-',
    ACCOUNT: '-', CONTENT: '-', DESIGN: '-', MEDIA: '-', TECHNICAL: '-',
  },
};

function PermBadge({ perm }: { perm: Permission }) {
  if (perm === 'W') {
    return (
      <Badge variant="default" className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/15 text-[10px] px-1.5">
        W
      </Badge>
    );
  }
  if (perm === 'R') {
    return (
      <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 text-[10px] px-1.5">
        R
      </Badge>
    );
  }
  return (
    <span className="text-xs text-muted-foreground/50">—</span>
  );
}

export function PermissionMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
              Tính năng
            </th>
            {ROLES.map((role) => (
              <th
                key={role}
                className="px-2 py-2 text-center font-medium text-muted-foreground text-xs whitespace-nowrap"
              >
                {UserRoleLabels[role].split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature) => (
            <tr key={feature} className="border-b border-border/50">
              <td className="py-2.5 pr-4 font-medium">{feature}</td>
              {ROLES.map((role) => (
                <td key={role} className="px-2 py-2.5 text-center">
                  <PermBadge perm={PERMISSIONS[feature][role]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Badge variant="default" className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/15 text-[10px] px-1.5">W</Badge>
          Đọc & Ghi
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 text-[10px] px-1.5">R</Badge>
          Chỉ đọc
        </span>
        <span className="flex items-center gap-1">
          <span className="text-muted-foreground/50">—</span>
          Không có quyền
        </span>
      </div>
    </div>
  );
}
