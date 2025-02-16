import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Editor from '@monaco-editor/react';
import { Configuration } from '@/types/config';

interface EditConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: Configuration | null;
  onSave: (configuration: Configuration) => void;
}

export function EditConfigurationDialog({
  open,
  onOpenChange,
  configuration,
  onSave,
}: EditConfigurationDialogProps) {
  const [label, setLabel] = useState('');
  const [setting, setSetting] = useState('');
  const [settings, setSettings] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (configuration) {
      setLabel(configuration.label);
      setSetting(JSON.stringify(configuration.setting, null, 2));
      setSettings(JSON.stringify(configuration.settings, null, 2));
    }
  }, [configuration]);

  const handleSave = () => {
    try {
      // Validate JSON
      const parsedSetting = JSON.parse(setting);
      const parsedSettings = JSON.parse(settings);

      if (configuration) {
        onSave({
          ...configuration,
          label,
          setting: parsedSetting,
          settings: parsedSettings,
        });
      }
      setError(null);
      onOpenChange(false);
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  if (!configuration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="setting">Setting (JSON)</Label>
            <div className="h-[200px] border rounded-md overflow-hidden">
              <Editor
                height="200px"
                defaultLanguage="json"
                value={setting}
                onChange={(value) => setSetting(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'off',
                }}
                theme="vs-light"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="settings">Settings (JSON)</Label>
            <div className="h-[200px] border rounded-md overflow-hidden">
              <Editor
                height="200px"
                defaultLanguage="json"
                value={settings}
                onChange={(value) => setSettings(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'off',
                }}
                theme="vs-light"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}