'use client';

import { Headphones, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientSupportCardProps {
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  className?: string;
}

/**
 * Client Support Card Component
 *
 * A contact/support card with Apple-inspired design.
 * Shows support information with teal accent color.
 */
export function ClientSupportCard({
  title = 'Can ho tro?',
  description = 'Doi ngu cua chung toi luon san sang',
  email = 'support@bcagency.vn',
  phone = '+84 123 456 789',
  className,
}: ClientSupportCardProps) {
  return (
    <div className={cn('client-support-card', className)}>
      <div className="client-support-content">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-white/10">
            <Headphones className="h-5 w-5 text-[var(--client-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[var(--client-primary)] transition-colors"
          >
            <Mail className="h-4 w-4" />
            {email}
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[var(--client-primary)] transition-colors"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        </div>
      </div>
    </div>
  );
}
