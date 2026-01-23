'use client';

import { FolderKanban, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientProjects } from '@/hooks/use-client-projects';
import { useClientStore } from '@/store/client.store';

export default function ClientDashboardPage() {
  const { client } = useClientStore();
  const { data, isLoading } = useClientProjects();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const projects = data?.projects || [];
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter((p) => p.status === 'DONE').length;
  const pendingProjects = projects.filter((p) => p.status === 'TODO').length;

  const stats = [
    {
      title: 'Tổng dự án',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-blue-500',
    },
    {
      title: 'Đang thực hiện',
      value: activeProjects,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Hoàn thành',
      value: completedProjects,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Chờ xử lý',
      value: pendingProjects,
      icon: AlertCircle,
      color: 'text-gray-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Xin chào, {client?.companyName}
        </h1>
        <p className="text-muted-foreground">
          Tổng quan về các dự án của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dự án gần đây</CardTitle>
          <CardDescription>Các dự án được cập nhật gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có dự án nào
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.taskStats.completed}/{project.taskStats.total} tasks hoàn thành
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {project.progress}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
