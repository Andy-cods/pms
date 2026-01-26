'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  User,
  Flag,
  Mail,
  Phone,
  Pause,
  Search as SearchIcon,
  ListTodo,
  FileArchive,
  Target,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientProject } from '@/hooks/use-client-projects';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  TODO: {
    label: 'Cho xu ly',
    icon: AlertCircle,
    className: 'client-badge-todo',
  },
  IN_PROGRESS: {
    label: 'Dang thuc hien',
    icon: Clock,
    className: 'client-badge-in-progress',
  },
  DONE: {
    label: 'Hoan thanh',
    icon: CheckCircle2,
    className: 'client-badge-done',
  },
  ON_HOLD: {
    label: 'Tam dung',
    icon: Pause,
    className: 'client-badge-on-hold',
  },
  IN_REVIEW: {
    label: 'Dang review',
    icon: SearchIcon,
    className: 'client-badge-in-review',
  },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Thap', className: 'text-muted-foreground' },
  MEDIUM: { label: 'Trung binh', className: 'text-primary' },
  HIGH: { label: 'Cao', className: 'text-warning' },
  URGENT: { label: 'Khan cap', className: 'text-destructive' },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, isError } = useClientProject(id);
  const [activeTab, setActiveTab] = useState<'tasks' | 'files'>('tasks');

  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-5 w-[480px]" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-8 py-4">
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai
        </Link>
        <div className="client-card-static">
          <div className="client-empty py-16">
            <AlertCircle className="client-empty-icon" />
            <p className="client-empty-title">Khong tim thay du an</p>
            <p className="client-empty-description">
              Du an nay khong ton tai hoac ban khong co quyen truy cap.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const projectStatus = statusConfig[project.status] || statusConfig.TODO;
  const ProjectStatusIcon = projectStatus.icon;

  return (
    <div className="space-y-8 py-4">
      {/* Back Navigation */}
      <Link
        href="/client/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors client-animate-in"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lai danh sach du an
      </Link>

      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 client-animate-in client-stagger-1">
        <div className="flex-1">
          <h1 className="client-page-title">{project.name}</h1>
          {project.description && (
            <p className="client-page-subtitle mt-2 max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        <span className={cn('client-badge text-sm', projectStatus.className)}>
          <ProjectStatusIcon className="h-4 w-4" />
          {projectStatus.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 client-animate-in client-stagger-2">
        {/* Progress Card */}
        <div className="client-card-static p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--client-primary-light)]">
              <TrendingUp className="h-5 w-5 text-[var(--client-primary)]" />
            </div>
            <span className="text-sm text-muted-foreground">Tien do</span>
          </div>
          <div className="text-3xl font-bold text-[var(--client-primary)]">
            {project.progress}%
          </div>
          <div className="client-progress-bar mt-3">
            <div
              className="client-progress-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Total Tasks Card */}
        <div className="client-card-static p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Tong tasks</span>
          </div>
          <div className="text-3xl font-bold">{project.taskStats.total}</div>
        </div>

        {/* Completed Tasks Card */}
        <div className="client-card-static p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--client-primary-light)]">
              <Target className="h-5 w-5 text-[var(--client-primary)]" />
            </div>
            <span className="text-sm text-muted-foreground">Hoan thanh</span>
          </div>
          <div className="text-3xl font-bold text-[var(--client-primary)]">
            {project.taskStats.completed}
          </div>
        </div>

        {/* In Progress Tasks Card */}
        <div className="client-card-static p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Dang xu ly</span>
          </div>
          <div className="text-3xl font-bold text-primary">
            {project.taskStats.inProgress}
          </div>
        </div>
      </div>

      {/* Project Details Row */}
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground client-animate-in client-stagger-3">
        {project.startDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Bat dau: {new Date(project.startDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
        {project.endDate && (
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span>
              Han chot: {new Date(project.endDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="client-tabs client-animate-in client-stagger-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn('client-tab', activeTab === 'tasks' && 'active')}
        >
          <ListTodo className="h-4 w-4 mr-2 inline" />
          Cong viec ({project.tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={cn('client-tab', activeTab === 'files' && 'active')}
        >
          <FileArchive className="h-4 w-4 mr-2 inline" />
          Tai lieu ({project.files.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="client-animate-in client-stagger-5">
        {activeTab === 'tasks' && (
          <div className="client-card-static">
            <div className="client-card-content">
              <div className="mb-6">
                <h2 className="client-section-title">Danh sach cong viec</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cac cong viec trong du an
                </p>
              </div>

              {project.tasks.length === 0 ? (
                <div className="client-empty py-12">
                  <ListTodo className="client-empty-icon" />
                  <p className="client-empty-title">Chua co cong viec nao</p>
                  <p className="client-empty-description">
                    Cac cong viec se hien thi o day khi duoc tao.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.tasks.map((task, index) => {
                    const taskStatus = statusConfig[task.status] || statusConfig.TODO;
                    const TaskStatusIcon = taskStatus.icon;
                    const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'client-task-item',
                          'client-animate-in',
                          `client-stagger-${Math.min(index + 1, 6)}`
                        )}
                      >
                        <div className="client-task-status">
                          <TaskStatusIcon
                            className={cn(
                              'client-task-status-icon',
                              task.status === 'DONE' && 'done',
                              task.status === 'IN_PROGRESS' && 'in-progress',
                              task.status === 'TODO' && 'todo'
                            )}
                          />
                        </div>

                        <div className="client-task-content">
                          <div className="client-task-title">{task.title}</div>
                          {task.assignee && (
                            <div className="client-task-assignee">
                              <User className="h-3 w-3 inline mr-1" />
                              {task.assignee.name}
                            </div>
                          )}
                        </div>

                        <div className="client-task-meta">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded',
                              priority.className,
                              'bg-muted'
                            )}
                          >
                            {priority.label}
                          </span>
                          <span className={cn('client-badge', taskStatus.className)}>
                            {taskStatus.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="client-card-static">
            <div className="client-card-content">
              <div className="mb-6">
                <h2 className="client-section-title">Tai lieu da duyet</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cac file da duoc phe duyet cho du an
                </p>
              </div>

              {project.files.length === 0 ? (
                <div className="client-empty py-12">
                  <FileArchive className="client-empty-icon" />
                  <p className="client-empty-title">Chua co file nao</p>
                  <p className="client-empty-description">
                    Cac file da duyet se hien thi o day.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.files.map((file, index) => (
                    <div
                      key={file.id}
                      className={cn(
                        'client-file-item',
                        'client-animate-in',
                        `client-stagger-${Math.min(index + 1, 6)}`
                      )}
                    >
                      <div className="client-file-icon">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="client-file-info">
                        <div className="client-file-name">{file.originalName}</div>
                        <div className="client-file-meta">
                          {formatFileSize(file.size)} &bull; {file.uploadedBy.name}
                        </div>
                      </div>

                      <div className="client-file-action">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Tai xuong
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Support Contact Section */}
      <div className="client-support-card client-animate-in client-stagger-6">
        <div className="client-support-content">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/50 dark:bg-white/10">
              <Headphones className="h-6 w-6 text-[var(--client-primary)]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Can ho tro du an?</p>
              <h3 className="font-semibold text-lg">Lien he BC Agency</h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
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
  );
}
