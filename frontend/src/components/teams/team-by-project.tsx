'use client';

import { FolderKanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { ProjectLifecycleLabels } from '@/types';
import type { ProjectLifecycle } from '@/types';

export function TeamByProject() {
  const { data, isLoading } = useProjects({ limit: 100 });
  const projects = data?.projects ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-10 text-center text-muted-foreground">
          Chưa có dự án nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const members = project.team ?? [];
        return (
          <Card key={project.id} className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {ProjectLifecycleLabels[project.lifecycle as ProjectLifecycle] || project.lifecycle}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {members.length} thành viên
                </Badge>
              </div>
            </CardHeader>
            {members.length > 0 && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3">
                  {members.map((member) => {
                    const u = member.user;
                    if (!u) return null;
                    const initials = u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <div key={member.id} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.avatar || undefined} alt={u.name} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {member.role}
                        </Badge>
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
