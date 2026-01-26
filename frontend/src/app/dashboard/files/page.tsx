'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  Trash2,
  Search,
  Grid,
  List,
  Eye,
  MoreHorizontal,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

import { useFiles, useDeleteFile, useDownloadFile } from '@/hooks/use-files';
import { useProjects } from '@/hooks/use-projects';
import {
  type FileCategory,
  FileCategoryLabels,
  FileCategoryColors,
  formatFileSize,
  getFileIcon,
  isPreviewable,
} from '@/lib/api/files';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { FileUploader } from '@/components/file/file-uploader';

export default function FilesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: filesData, isLoading, refetch } = useFiles({
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    limit: 100,
  });
  const { data: projectsData } = useProjects({ limit: 100 });

  const deleteMutation = useDeleteFile();
  const downloadMutation = useDownloadFile();

  const files = useMemo(() => filesData?.files ?? [], [filesData?.files]);

  const handleDelete = async () => {
    if (deletingFileId) {
      await deleteMutation.mutateAsync(deletingFileId);
      setDeletingFileId(null);
      refetch();
    }
  };

  const handleDownload = (id: string, filename: string) => {
    downloadMutation.mutate({ id, filename });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const groupedByProject = useMemo(() => {
    const groups: Record<string, typeof files> = {};
    files.forEach((f) => {
      const key = f.project?.id ? `${f.project.code} — ${f.project.name}` : 'Không gắn dự án';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [files]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Quản lý tài liệu</p>
          <h1 className="text-2xl font-semibold">Tài liệu</h1>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm, tải lên và tải xuống tài liệu dự án.
          </p>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Tải tệp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tải tệp lên</DialogTitle>
              <DialogDescription>
                Chọn dự án (bắt buộc) và tải tài liệu lên hệ thống.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projectsData?.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedProject && (
                <p className="text-xs text-muted-foreground">
                  Vui lòng chọn dự án trước khi tải lên.
                </p>
              )}
            </div>
            {selectedProject ? (
              <FileUploader
                projectId={selectedProject}
                onSuccess={() => {
                  setIsUploadDialogOpen(false);
                  refetch();
                  setSelectedProject('');
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chọn dự án để bật tính năng tải tệp.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, thẻ, dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as FileCategory | 'ALL')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(FileCategoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 font-medium">Chưa có tài liệu</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tải tài liệu đầu tiên để bắt đầu.
            </p>
            <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Tải tệp
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isPreviewable(file.mimeType) && (
                        <DropdownMenuItem onClick={() => setPreviewUrl(file.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem nhanh
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDownload(file.id, file.originalName)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingFileId(file.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <p className="font-medium truncate">{file.originalName}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={FileCategoryColors[file.category]}>
                      {FileCategoryLabels[file.category]}
                    </Badge>
                    <span>•</span>
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                  {file.project && (
                    <button
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => router.push(`/dashboard/projects/${file.project?.id}`)}
                    >
                      {file.project.code} · {file.project.name}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByProject).map(([projectTitle, projectFiles]) => (
            <Card key={projectTitle}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">{projectTitle}</p>
                  {projectTitle !== 'Không gắn dự án' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const projectId = projectFiles[0].project?.id;
                        if (projectId) router.push(`/dashboard/projects/${projectId}/files`);
                      }}
                    >
                      Xem tất cả
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {projectFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="text-xl">{getFileIcon(file.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className={FileCategoryColors[file.category]}>
                            {FileCategoryLabels[file.category]}
                          </Badge>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.uploadedAt)}</span>
                          <span>•</span>
                          <span>từ {file.uploadedBy.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isPreviewable(file.mimeType) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewUrl(file.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file.id, file.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingFileId(file.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingFileId} onOpenChange={() => setDeletingFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tệp?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tệp sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem trước</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">
                Xem trước sẽ khả dụng sau khi kết nối máy chủ MinIO
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
