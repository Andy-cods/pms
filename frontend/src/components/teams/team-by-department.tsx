'use client';

import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { UserRole, UserRoleLabels } from '@/types';
import type { AdminUserWithWorkload } from '@/lib/api/admin-users';

interface TeamByDepartmentProps {
  users: AdminUserWithWorkload[];
}

const ROLE_ORDER: UserRole[] = [
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

export function TeamByDepartment({ users }: TeamByDepartmentProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Group users by role
  const grouped = new Map<UserRole, AdminUserWithWorkload[]>();
  for (const user of users) {
    const role = user.role as UserRole;
    if (!grouped.has(role)) grouped.set(role, []);
    grouped.get(role)!.push(user);
  }

  const toggleCollapse = (role: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const orderedRoles = ROLE_ORDER.filter((r) => grouped.has(r));

  if (orderedRoles.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center text-muted-foreground">
          Không có thành viên nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orderedRoles.map((role) => {
        const members = grouped.get(role) ?? [];
        const isCollapsed = collapsed.has(role);

        return (
          <Card key={role} className="border-border/70">
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 h-auto hover:bg-transparent"
              onClick={() => toggleCollapse(role)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 mr-2 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2 shrink-0" />
              )}
              <span className="font-medium text-sm">
                {UserRoleLabels[role]}
              </span>
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {members.length}
              </Badge>
            </Button>

            {!isCollapsed && (
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  {members.map((user) => {
                    const initials = user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const w = user.workload;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right text-xs text-muted-foreground w-20">
                            <div>{w.totalTasks} tasks</div>
                            <div>{w.projectCount} dự án</div>
                          </div>
                          <div className="w-16">
                            <Progress value={w.completionPercent} className="h-1.5" />
                            <div className="text-[10px] text-center text-muted-foreground mt-0.5">
                              {w.completionPercent}%
                            </div>
                          </div>
                          {w.overdueTasks > 0 && (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {w.overdueTasks}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
