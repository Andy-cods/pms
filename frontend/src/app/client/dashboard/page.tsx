'use client';

import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Headphones,
  Mail,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientProjects } from '@/hooks/use-client-projects';
import { useClientStore } from '@/store/client.store';
import { cn } from '@/lib/utils';

export default function ClientDashboardPage() {
  const { client } = useClientStore();
  const { data, isLoading } = useClientProjects();

  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        {/* Welcome Skeleton */}
        <div className="client-welcome">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-80 mb-4" />
          <Skeleton className="h-5 w-[480px]" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter((p) => p.status === 'DONE').length;
  const pendingProjects = projects.filter((p) => p.status === 'TODO').length;

  // Calculate overall progress
  const overallProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + p.progress, 0) / projects.length
        )
      : 0;

  const stats = [
    {
      title: 'Tong du an',
      value: totalProjects,
      icon: FolderKanban,
      color: 'text-[var(--client-primary)]',
      bgColor: 'bg-[var(--client-primary-light)]',
    },
    {
      title: 'Dang thuc hien',
      value: activeProjects,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Hoan thanh',
      value: completedProjects,
      icon: CheckCircle2,
      color: 'text-[var(--client-primary)]',
      bgColor: 'bg-[var(--client-primary-light)]',
    },
    {
      title: 'Cho xu ly',
      value: pendingProjects,
      icon: AlertCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chao buoi sang';
    if (hour < 18) return 'Chao buoi chieu';
    return 'Chao buoi toi';
  };

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Section */}
      <section className="client-welcome client-animate-in">
        <p className="client-welcome-greeting">{getGreeting()}</p>
        <h1 className="client-welcome-title">
          Xin chao, {client?.companyName}
        </h1>
        <p className="client-welcome-message">
          Chao mung ban quay lai. Day la tong quan ve tien do cac du an cua ban
          voi BC Agency.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={cn(
              'client-stat-card client-animate-in',
              `client-stagger-${index + 1}`
            )}
          >
            <div className={cn('client-stat-icon', stat.bgColor)}>
              <stat.icon className={cn('h-6 w-6', stat.color)} />
            </div>
            <div className="client-stat-value">{stat.value}</div>
            <div className="client-stat-label">{stat.title}</div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2 client-card-static client-animate-in client-stagger-5">
          <div className="client-card-content">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="client-section-title">Du an gan day</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cac du an duoc cap nhat gan nhat
                </p>
              </div>
              <Link
                href="/client/projects"
                className="client-btn client-btn-ghost text-sm"
              >
                Xem tat ca
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="client-empty">
                <FolderKanban className="client-empty-icon" />
                <p className="client-empty-title">Chua co du an nao</p>
                <p className="client-empty-description">
                  Cac du an cua ban se hien thi o day khi duoc tao.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 4).map((project, index) => (
                  <Link
                    key={project.id}
                    href={`/client/projects/${project.id}`}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-muted transition-colors group',
                      'client-animate-in',
                      `client-stagger-${index + 1}`
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            project.status === 'DONE' && 'bg-[var(--client-primary)]',
                            project.status === 'IN_PROGRESS' && 'bg-primary',
                            project.status === 'TODO' && 'bg-muted-foreground',
                            project.status === 'ON_HOLD' && 'bg-warning'
                          )}
                        />
                        <span className="font-medium truncate">
                          {project.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {project.taskStats.completed}/{project.taskStats.total} tasks
                        </span>
                        {project.endDate && (
                          <span>
                            Han: {new Date(project.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-[var(--client-primary)]">
                          {project.progress}%
                        </div>
                        <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-[var(--client-primary)] rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Overall Progress Card */}
          <div className="client-card-static client-animate-in client-stagger-6">
            <div className="client-card-content text-center">
              <div className="relative inline-flex items-center justify-center">
                {/* Circular Progress */}
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="var(--surface)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="var(--client-primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallProgress / 100) * 352} 352`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{overallProgress}%</span>
                  <span className="text-xs text-muted-foreground">tong tien do</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-[var(--client-primary)]" />
                <span>Tien do chung cua tat ca du an</span>
              </div>
            </div>
          </div>

          {/* Support Contact Card */}
          <div className="client-support-card client-animate-in client-stagger-6">
            <div className="client-support-content">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-white/10">
                  <Headphones className="h-5 w-5 text-[var(--client-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold">Can ho tro?</h3>
                  <p className="text-sm text-muted-foreground">
                    Doi ngu cua chung toi luon san sang
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href="mailto:support@bcagency.vn"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[var(--client-primary)] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  support@bcagency.vn
                </a>
                <a
                  href="tel:+84123456789"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[var(--client-primary)] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +84 123 456 789
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
