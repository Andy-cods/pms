'use client';

import { useState } from 'react';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useSettings, useUpdateSetting } from '@/hooks/use-admin';

interface SettingValue {
  [key: string]: string | number | boolean;
}

export default function AdminSettingsPage() {
  const { data, isLoading } = useSettings();
  const updateMutation = useUpdateSetting();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleEdit = (key: string, value: Record<string, unknown>) => {
    setEditingKey(key);
    setEditValue(JSON.stringify(value, null, 2));
  };

  const handleSave = async (key: string) => {
    try {
      const parsedValue = JSON.parse(editValue);
      await updateMutation.mutateAsync({ key, value: parsedValue });
      setEditingKey(null);
    } catch {
      // Invalid JSON
    }
  };

  const handleAddNew = async () => {
    if (!newKey.trim()) return;
    try {
      const parsedValue = JSON.parse(newValue || '{}');
      await updateMutation.mutateAsync({ key: newKey, value: parsedValue });
      setNewKey('');
      setNewValue('');
    } catch {
      // Invalid JSON
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const settings = data?.settings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Quản lý cấu hình hệ thống
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm cài đặt mới</CardTitle>
          <CardDescription>Tạo một cài đặt mới cho hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="new-key">Khóa</Label>
              <Input
                id="new-key"
                placeholder="setting_key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-value">Giá trị (JSON)</Label>
              <div className="flex gap-2">
                <Input
                  id="new-value"
                  placeholder='{"key": "value"}'
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <Button onClick={handleAddNew} disabled={!newKey.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cài đặt</CardTitle>
          <CardDescription>Các cài đặt hiện có trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="mt-2 text-muted-foreground">Chưa có cài đặt nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <code className="text-sm font-semibold bg-muted px-2 py-1 rounded">
                        {setting.key}
                      </code>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cập nhật: {new Date(setting.updatedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    {editingKey !== setting.key && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting.key, setting.value)}
                      >
                        Sửa
                      </Button>
                    )}
                  </div>

                  {editingKey === setting.key ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={5}
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(setting.key)}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Lưu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingKey(null)}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(setting.value, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
