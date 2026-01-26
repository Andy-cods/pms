'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Save,
  Building2,
  Mail,
  Send,
  Bell,
  Loader2,
  Upload,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/use-admin';
import { type UpdateSystemSettingsInput } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const { data: settings, isLoading, error } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  // Track local changes only (delta from server state)
  const [localChanges, setLocalChanges] = useState<Partial<UpdateSystemSettingsInput>>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Compute form data by merging server state with local changes
  const formData: UpdateSystemSettingsInput = useMemo(() => {
    if (!settings) return {};
    return {
      companyName: localChanges.companyName ?? settings.companyName,
      companyLogo: localChanges.companyLogo ?? settings.companyLogo,
      emailEnabled: localChanges.emailEnabled ?? settings.emailEnabled,
      smtpHost: localChanges.smtpHost ?? settings.smtpHost ?? '',
      smtpPort: localChanges.smtpPort ?? settings.smtpPort,
      smtpUser: localChanges.smtpUser ?? settings.smtpUser ?? '',
      telegramEnabled: localChanges.telegramEnabled ?? settings.telegramEnabled,
      telegramBotToken: localChanges.telegramBotToken,
      telegramBotUsername: localChanges.telegramBotUsername ?? settings.telegramBotUsername ?? '',
      defaultNotifications: {
        ...settings.defaultNotifications,
        ...localChanges.defaultNotifications,
      },
    };
  }, [settings, localChanges]);

  const hasChanges = Object.keys(localChanges).length > 0;

  const handleInputChange = useCallback((field: keyof UpdateSystemSettingsInput, value: unknown) => {
    setLocalChanges((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNotificationChange = useCallback((
    field: keyof NonNullable<UpdateSystemSettingsInput['defaultNotifications']>,
    value: boolean
  ) => {
    setLocalChanges((prev) => ({
      ...prev,
      defaultNotifications: {
        ...prev.defaultNotifications,
        [field]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setLocalChanges({});
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch {
      // Error is handled by the mutation
    }
  }, [formData, updateMutation]);

  const handleReset = useCallback(() => {
    setLocalChanges({});
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Settings Cards Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">Loi khi tai cai dat</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Khong the tai cau hinh he thong. Vui long thu lai sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cai dat</h1>
          <p className="text-muted-foreground mt-1">
            Cau hinh chung cua he thong
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <SettingsSection
          icon={Building2}
          title="Thong tin cong ty"
          description="Cau hinh thong tin co ban"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Ten cong ty
              </Label>
              <Input
                id="companyName"
                placeholder="BC Agency"
                value={formData.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLogo" className="text-sm font-medium">
                URL Logo
              </Label>
              <div className="flex gap-2">
                <Input
                  id="companyLogo"
                  placeholder="https://example.com/logo.png"
                  value={formData.companyLogo || ''}
                  onChange={(e) =>
                    handleInputChange('companyLogo', e.target.value || null)
                  }
                  className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  title="Tai len logo"
                  className="h-11 w-11 rounded-xl border-border/50"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {formData.companyLogo && (
                <div className="mt-3 p-3 bg-surface rounded-xl border border-border/50">
                  <Image
                    src={formData.companyLogo}
                    alt="Company logo preview"
                    width={48}
                    height={48}
                    className="h-12 w-auto rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* Email Settings */}
        <SettingsSection
          icon={Mail}
          title="Cai dat Email"
          description="Cau hinh gui email thong bao"
        >
          <div className="space-y-5">
            <SettingsToggle
              label="Bat email"
              description="Gui thong bao qua email"
              checked={formData.emailEnabled || false}
              onCheckedChange={(checked) => handleInputChange('emailEnabled', checked)}
            />

            <div className="h-px bg-border/50" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost" className="text-sm font-medium">
                  SMTP Host
                </Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.gmail.com"
                  value={formData.smtpHost || ''}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  disabled={!formData.emailEnabled}
                  className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpPort" className="text-sm font-medium">
                    Port
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    value={formData.smtpPort || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'smtpPort',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    disabled={!formData.emailEnabled}
                    className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser" className="text-sm font-medium">
                    User
                  </Label>
                  <Input
                    id="smtpUser"
                    placeholder="user@example.com"
                    value={formData.smtpUser || ''}
                    onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                    disabled={!formData.emailEnabled}
                    className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Telegram Settings */}
        <SettingsSection
          icon={Send}
          title="Cai dat Telegram"
          description="Cau hinh thong bao qua Telegram"
        >
          <div className="space-y-5">
            <SettingsToggle
              label="Bat Telegram"
              description="Gui thong bao qua Telegram Bot"
              checked={formData.telegramEnabled || false}
              onCheckedChange={(checked) => handleInputChange('telegramEnabled', checked)}
            />

            <div className="h-px bg-border/50" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegramBotToken" className="text-sm font-medium">
                  Bot Token
                </Label>
                <Input
                  id="telegramBotToken"
                  type="password"
                  placeholder="Nhap token moi de cap nhat"
                  onChange={(e) =>
                    handleInputChange('telegramBotToken', e.target.value)
                  }
                  disabled={!formData.telegramEnabled}
                  className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Token duoc an de bao mat. Nhap token moi de cap nhat.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegramBotUsername" className="text-sm font-medium">
                  Bot Username
                </Label>
                <Input
                  id="telegramBotUsername"
                  placeholder="@mybot"
                  value={formData.telegramBotUsername || ''}
                  onChange={(e) =>
                    handleInputChange('telegramBotUsername', e.target.value)
                  }
                  disabled={!formData.telegramEnabled}
                  className="h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notification Defaults */}
        <SettingsSection
          icon={Bell}
          title="Mac dinh thong bao"
          description="Cai dat mac dinh cho nguoi dung moi"
        >
          <div className="space-y-4">
            <SettingsToggle
              label="Email thong bao"
              description="Nhan thong bao qua email"
              checked={formData.defaultNotifications?.emailEnabled ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('emailEnabled', checked)
              }
            />

            <SettingsToggle
              label="Telegram thong bao"
              description="Nhan thong bao qua Telegram"
              checked={formData.defaultNotifications?.telegramEnabled ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('telegramEnabled', checked)
              }
            />

            <div className="h-px bg-border/50 my-2" />

            <SettingsToggle
              label="Phan cong task"
              description="Thong bao khi duoc phan cong"
              checked={formData.defaultNotifications?.taskAssignment ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('taskAssignment', checked)
              }
            />

            <SettingsToggle
              label="Nhac nho deadline"
              description="Thong bao truoc khi het han"
              checked={formData.defaultNotifications?.taskDueReminder ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('taskDueReminder', checked)
              }
            />

            <SettingsToggle
              label="Yeu cau phe duyet"
              description="Thong bao khi co yeu cau phe duyet"
              checked={formData.defaultNotifications?.approvalRequest ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('approvalRequest', checked)
              }
            />

            <SettingsToggle
              label="Cap nhat du an"
              description="Thong bao khi du an co thay doi"
              checked={formData.defaultNotifications?.projectUpdate ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('projectUpdate', checked)
              }
            />

            <SettingsToggle
              label="De cap trong comment"
              description="Thong bao khi duoc mention"
              checked={formData.defaultNotifications?.commentMention ?? true}
              onCheckedChange={(checked) =>
                handleNotificationChange('commentMention', checked)
              }
            />
          </div>
        </SettingsSection>
      </div>

      {/* Sticky Save Bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
          hasChanges ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {showSaveSuccess ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Da luu thay doi
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Co thay doi chua luu
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Huy
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="rounded-xl min-w-[120px]"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Luu thay doi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for sticky bar */}
      {hasChanges && <div className="h-20" />}
    </div>
  );
}

// Settings Section Component
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Apple-style Toggle Component
function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className={cn('text-sm font-medium', disabled && 'opacity-50')}>
          {label}
        </Label>
        <p className={cn('text-xs text-muted-foreground', disabled && 'opacity-50')}>
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
