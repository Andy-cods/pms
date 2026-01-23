'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building2,
  Mail,
  Send,
  Bell,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/use-admin';
import { type UpdateSystemSettingsInput } from '@/lib/api/admin';

export default function AdminSettingsPage() {
  const { data: settings, isLoading, error } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  // Form state
  const [formData, setFormData] = useState<UpdateSystemSettingsInput>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        emailEnabled: settings.emailEnabled,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser || '',
        telegramEnabled: settings.telegramEnabled,
        telegramBotUsername: settings.telegramBotUsername || '',
        defaultNotifications: settings.defaultNotifications,
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleInputChange = (field: keyof UpdateSystemSettingsInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (
    field: keyof NonNullable<UpdateSystemSettingsInput['defaultNotifications']>,
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultNotifications: {
        ...prev.defaultNotifications,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setHasChanges(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        emailEnabled: settings.emailEnabled,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser || '',
        telegramEnabled: settings.telegramEnabled,
        telegramBotUsername: settings.telegramBotUsername || '',
        defaultNotifications: settings.defaultNotifications,
      });
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Loi khi tai cai dat</h3>
          <p className="mt-2 text-muted-foreground">
            Khong the tai cau hinh he thong. Vui long thu lai sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cai dat he thong</h1>
          <p className="text-muted-foreground">
            Quan ly cau hinh chung cua he thong
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Huy thay doi
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Luu thay doi
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Thong tin cong ty</CardTitle>
            </div>
            <CardDescription>
              Cau hinh thong tin co ban cua cong ty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Ten cong ty</Label>
              <Input
                id="companyName"
                placeholder="BC Agency"
                value={formData.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLogo">URL Logo</Label>
              <div className="flex gap-2">
                <Input
                  id="companyLogo"
                  placeholder="https://example.com/logo.png"
                  value={formData.companyLogo || ''}
                  onChange={(e) =>
                    handleInputChange('companyLogo', e.target.value || null)
                  }
                />
                <Button variant="outline" size="icon" title="Tai len logo">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {formData.companyLogo && (
                <div className="mt-2">
                  <img
                    src={formData.companyLogo}
                    alt="Company logo preview"
                    className="h-16 w-auto rounded border object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Cai dat Email</CardTitle>
            </div>
            <CardDescription>Cau hinh gui email thong bao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bat email</Label>
                <p className="text-sm text-muted-foreground">
                  Gui thong bao qua email
                </p>
              </div>
              <Switch
                checked={formData.emailEnabled || false}
                onCheckedChange={(checked) =>
                  handleInputChange('emailEnabled', checked)
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.gmail.com"
                  value={formData.smtpHost || ''}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  disabled={!formData.emailEnabled}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input
                    id="smtpUser"
                    placeholder="user@example.com"
                    value={formData.smtpUser || ''}
                    onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                    disabled={!formData.emailEnabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Cai dat Telegram</CardTitle>
            </div>
            <CardDescription>Cau hinh thong bao qua Telegram</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bat Telegram</Label>
                <p className="text-sm text-muted-foreground">
                  Gui thong bao qua Telegram Bot
                </p>
              </div>
              <Switch
                checked={formData.telegramEnabled || false}
                onCheckedChange={(checked) =>
                  handleInputChange('telegramEnabled', checked)
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegramBotToken">Bot Token</Label>
                <Input
                  id="telegramBotToken"
                  type="password"
                  placeholder="Nhap token moi de cap nhat"
                  onChange={(e) =>
                    handleInputChange('telegramBotToken', e.target.value)
                  }
                  disabled={!formData.telegramEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Token duoc an de bao mat. Nhap token moi de cap nhat.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegramBotUsername">Bot Username</Label>
                <Input
                  id="telegramBotUsername"
                  placeholder="@mybot"
                  value={formData.telegramBotUsername || ''}
                  onChange={(e) =>
                    handleInputChange('telegramBotUsername', e.target.value)
                  }
                  disabled={!formData.telegramEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Mac dinh thong bao</CardTitle>
            </div>
            <CardDescription>
              Cai dat mac dinh cho thong bao nguoi dung moi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email thong bao</Label>
                <p className="text-sm text-muted-foreground">
                  Nhan thong bao qua email
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.emailEnabled ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('emailEnabled', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Telegram thong bao</Label>
                <p className="text-sm text-muted-foreground">
                  Nhan thong bao qua Telegram
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.telegramEnabled ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('telegramEnabled', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Phan cong task</Label>
                <p className="text-sm text-muted-foreground">
                  Thong bao khi duoc phan cong task
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.taskAssignment ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('taskAssignment', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nhac nho deadline</Label>
                <p className="text-sm text-muted-foreground">
                  Thong bao truoc khi task het han
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.taskDueReminder ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('taskDueReminder', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Yeu cau phe duyet</Label>
                <p className="text-sm text-muted-foreground">
                  Thong bao khi co yeu cau phe duyet
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.approvalRequest ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('approvalRequest', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cap nhat du an</Label>
                <p className="text-sm text-muted-foreground">
                  Thong bao khi du an co thay doi
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.projectUpdate ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('projectUpdate', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>De cap trong comment</Label>
                <p className="text-sm text-muted-foreground">
                  Thong bao khi duoc mention trong comment
                </p>
              </div>
              <Switch
                checked={formData.defaultNotifications?.commentMention ?? true}
                onCheckedChange={(checked) =>
                  handleNotificationChange('commentMention', checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
