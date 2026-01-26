'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';

import { ProjectForm } from '@/components/project/project-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NewProjectPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Header - Apple style with clean hierarchy */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-lg shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-title font-semibold tracking-tight">
                Tạo dự án mới
              </h1>
              <p className="text-callout text-muted-foreground">
                Điền thông tin để tạo dự án mới
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card - Apple style with generous padding */}
      <Card className="rounded-2xl border-border/50 shadow-apple-sm">
        <CardContent className="p-8">
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
