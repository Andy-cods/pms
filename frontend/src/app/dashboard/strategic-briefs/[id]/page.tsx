'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useBrief } from '@/hooks/use-strategic-brief';
import { BriefWizard } from '@/components/strategic-brief/brief-wizard';

export default function StrategicBriefPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const currentStep = parseInt(searchParams.get('step') || '1', 10);

  const { data: brief, isLoading } = useBrief(id);

  const handleStepChange = (step: number) => {
    router.push(`/dashboard/strategic-briefs/${id}?step=${step}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-secondary rounded animate-pulse" />
        <div className="flex gap-6">
          <div className="w-64 h-[600px] bg-secondary/30 rounded-2xl animate-pulse" />
          <div className="flex-1 h-[600px] bg-secondary/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Brief not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  return <BriefWizard brief={brief} currentStep={currentStep} onStepChange={handleStepChange} />;
}
