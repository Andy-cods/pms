import { LucideIcon, FolderOpen, FileText, CheckSquare, Bell, Search, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'projects' | 'tasks' | 'files' | 'notifications' | 'search' | 'users' | 'calendar' | 'default';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const emptyStateConfigs: Record<EmptyStateVariant, EmptyStateConfig> = {
  projects: {
    icon: FolderOpen,
    title: 'Chưa có dự án nào',
    description: 'Bắt đầu bằng cách tạo dự án đầu tiên của bạn.',
  },
  tasks: {
    icon: CheckSquare,
    title: 'Chưa có task nào',
    description: 'Tạo task mới để bắt đầu quản lý công việc.',
  },
  files: {
    icon: FileText,
    title: 'Chưa có file nào',
    description: 'Upload file đầu tiên để lưu trữ tài liệu.',
  },
  notifications: {
    icon: Bell,
    title: 'Không có thông báo',
    description: 'Bạn đã cập nhật tất cả thông báo.',
  },
  search: {
    icon: Search,
    title: 'Không tìm thấy kết quả',
    description: 'Thử tìm kiếm với từ khóa khác.',
  },
  users: {
    icon: Users,
    title: 'Chưa có thành viên',
    description: 'Thêm thành viên vào nhóm để bắt đầu cộng tác.',
  },
  calendar: {
    icon: Calendar,
    title: 'Không có sự kiện',
    description: 'Lịch của bạn đang trống.',
  },
  default: {
    icon: FolderOpen,
    title: 'Không có dữ liệu',
    description: 'Chưa có dữ liệu để hiển thị.',
  },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfigs[variant];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{displayTitle}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{displayDescription}</p>
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
