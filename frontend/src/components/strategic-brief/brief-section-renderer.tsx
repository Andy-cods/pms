'use client';

import type { BriefSection } from '@/lib/api/strategic-brief';
import type { SectionConfig } from './brief-section-config';
import { BriefSectionForm } from './brief-section-form';
import { BudgetAllocationSection } from './sections/budget-allocation-section';
import { TimelineSection } from './sections/timeline-section';
import { KpiMetricsSection } from './sections/kpi-metrics-section';
import { CompetitorsSection } from './sections/competitors-section';

interface BriefSectionRendererProps {
  section: BriefSection;
  config: SectionConfig;
  onSave: (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => void;
  readOnly?: boolean;
}

export function BriefSectionRenderer({ section, config, onSave, readOnly = false }: BriefSectionRendererProps) {
  if (config.customComponent) {
    switch (config.customComponent) {
      case 'budget-allocation':
        return <BudgetAllocationSection section={section} onSave={onSave} readOnly={readOnly} />;
      case 'timeline':
        return <TimelineSection section={section} onSave={onSave} readOnly={readOnly} />;
      case 'kpi-metrics':
        return <KpiMetricsSection section={section} onSave={onSave} readOnly={readOnly} />;
      case 'competitors':
        return <CompetitorsSection section={section} onSave={onSave} readOnly={readOnly} />;
    }
  }

  return (
    <BriefSectionForm
      section={section}
      fields={config.fields}
      onSave={onSave}
      readOnly={readOnly}
    />
  );
}
