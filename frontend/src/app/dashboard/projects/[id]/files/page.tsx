'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  Search,
  Grid,
  List,
  Eye,
  MoreHorizontal,
  FolderOpen,
} from 'lucide-react';

import { useProject } from '@/hooks/use-projects';
import { useProjectFiles, useDeleteFile, useDownloadFile } from '@/hooks/use-files';
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

export default function ProjectFilesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: filesData, isLoading: filesLoading, refetch } = useProjectFiles(projectId, {
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    limit: 100,
  });

  const deleteMutation = useDeleteFile();
  const downloadMutation = useDownloadFile();

  const isLoading = projectLoading || filesLoading;

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const files = filesData?.files ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tài liệu dự án</h1>
            <p className="text-muted-foreground">
              {project?.dealCode} - {project?.name}
            </p>
          </div>
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
              <DialogDescription>Thêm tài liệu vào {project?.name}</DialogDescription>
            </DialogHeader>
            <FileUploader
              projectId={projectId}
              onSuccess={() => {
                setIsUploadDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as FileCategory | 'ALL')}
        >
          <SelectTrigger className="w-40">
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

        {/* View Toggle */}
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

      {/* Files */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 font-medium">Chưa có tài liệu</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tải tài liệu đầu tiên để bắt đầu
            </p>
            <Button className="mt-4" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Tải tệp
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
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
                <h4 className="font-medium mt-3 truncate text-sm">{file.originalName}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={FileCategoryColors[file.category]}>
                    {FileCategoryLabels[file.category]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{file.originalName}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <Badge variant="outline" className={FileCategoryColors[file.category]}>
                      {FileCategoryLabels[file.category]}
                    </Badge>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                    <span>•</span>
                    <span>từ {file.uploadedBy.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isPreviewable(file.mimeType) && (
                    <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(file.id)}>
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
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
