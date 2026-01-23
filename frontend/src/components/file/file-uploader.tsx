'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';

import { useUploadFile } from '@/hooks/use-files';
import {
  type FileCategory,
  FileCategoryLabels,
  formatFileSize,
} from '@/lib/api/files';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  projectId: string;
  taskId?: string;
  onSuccess?: () => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
}

interface QueuedFile {
  file: File;
  category: FileCategory;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUploader({
  projectId,
  taskId,
  onSuccess,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept,
}: FileUploaderProps) {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const uploadMutation = useUploadFile();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: QueuedFile[] = acceptedFiles.map((file) => ({
        file,
        category: 'OTHER' as FileCategory,
        status: 'pending',
      }));
      setQueuedFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles: maxFiles - queuedFiles.length,
  });

  const updateFileCategory = (index: number, category: FileCategory) => {
    setQueuedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, category } : f))
    );
  };

  const removeFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    for (let i = 0; i < queuedFiles.length; i++) {
      const qf = queuedFiles[i];
      if (qf.status !== 'pending') continue;

      setUploadingIndex(i);
      setQueuedFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' } : f
        )
      );

      try {
        await uploadMutation.mutateAsync({
          file: qf.file,
          projectId,
          taskId,
          category: qf.category,
        });

        setQueuedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success' } : f
          )
        );
      } catch (error) {
        setQueuedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', error: (error as Error).message }
              : f
          )
        );
      }
    }

    setUploadingIndex(null);

    // Clear successful uploads after a delay
    setTimeout(() => {
      setQueuedFiles((prev) => prev.filter((f) => f.status !== 'success'));
      onSuccess?.();
    }, 1500);
  };

  const pendingCount = queuedFiles.filter((f) => f.status === 'pending').length;
  const hasFiles = queuedFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          hasFiles && 'p-4'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {formatFileSize(maxSize)} per file
        </p>
      </div>

      {/* File Queue */}
      {hasFiles && (
        <div className="space-y-2">
          {queuedFiles.map((qf, index) => (
            <div
              key={`${qf.file.name}-${index}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                qf.status === 'success' && 'bg-green-50 border-green-200',
                qf.status === 'error' && 'bg-red-50 border-red-200'
              )}
            >
              <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{qf.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(qf.file.size)}
                </p>
                {qf.status === 'uploading' && (
                  <Progress value={50} className="mt-1 h-1" />
                )}
                {qf.error && (
                  <p className="text-xs text-red-600 mt-1">{qf.error}</p>
                )}
              </div>

              {qf.status === 'pending' && (
                <Select
                  value={qf.category}
                  onValueChange={(v) => updateFileCategory(index, v as FileCategory)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FileCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {qf.status === 'uploading' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}

              {qf.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Upload Button */}
          {pendingCount > 0 && (
            <Button
              onClick={uploadFiles}
              disabled={uploadingIndex !== null}
              className="w-full"
            >
              {uploadingIndex !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
