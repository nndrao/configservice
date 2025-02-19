import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfigNode, Configuration } from '@/types/config';
import Editor from '@monaco-editor/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ConfigurationDialog({
  open,
  onOpenChange,
  onSave,
  currentNode,
  configuration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (configuration: Configuration) => void;
  currentNode: ConfigNode;
  configuration?: Configuration;
}) {
  const [componentType, setComponentType] = useState('');
  const [componentSubType, setComponentSubType] = useState('');
  const [label, setLabel] = useState('');
  const [settingJson, setSettingJson] = useState('{}');
  const [settingsJson, setSettingsJson] = useState('[]');
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [parsedSettings, setParsedSettings] = useState<Array<{ id: string }>>([]);
  const [jsonError, setJsonError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Get the current theme from the document
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
      setTheme(currentTheme || 'light');
    };

    // Initial theme
    updateTheme();

    // Create observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // Initialize form with existing configuration data when editing
  useEffect(() => {
    if (configuration) {
      setComponentType(configuration.componentType);
      setComponentSubType(configuration.componentSubType);
      setLabel(configuration.label);
      setSettingJson(JSON.stringify(configuration.setting, null, 2));
      setSettingsJson(JSON.stringify(configuration.settings, null, 2));
      setSelectedSettingId(configuration.activeSetting?.id || '');
    } else {
      // Reset form when adding new configuration
      setComponentType('');
      setComponentSubType('');
      setLabel('');
      setSettingJson('{}');
      setSettingsJson('[]');
      setSelectedSettingId('');
    }
  }, [configuration]);

  // Reset selectedSettingId when settingsJson changes
  useEffect(() => {
    if (!configuration) { // Only reset if not in edit mode
      setSelectedSettingId('');
    }
  }, [settingsJson, configuration]);

  useEffect(() => {
    try {
      const settings = JSON.parse(settingsJson);
      if (Array.isArray(settings)) {
        if (!settings.every(s => typeof s.id === 'string')) {
          setJsonError('Each setting in the array must have an id property');
          setParsedSettings([]);
          return;
        }
        setParsedSettings(settings);
        setJsonError('');
      } else {
        setJsonError('Settings must be an array of objects with id property');
        setParsedSettings([]);
      }
    } catch (e) {
      setJsonError('Invalid JSON format');
      setParsedSettings([]);
    }
  }, [settingsJson]);

  // If the dialog is open but there's no current node, close it
  useEffect(() => {
    if (open && !currentNode) {
      onOpenChange(false);
    }
  }, [open, currentNode, onOpenChange]);

  const handleSave = () => {
    try {
      // Validate settings JSON format
      const settings = JSON.parse(settingsJson);
      if (!Array.isArray(settings) || !settings.every(s => typeof s.id === 'string')) {
        throw new Error('Settings must be an array of objects with id property');
      }

      // Validate setting JSON
      const setting = JSON.parse(settingJson);

      // Find the active setting from the settings array
      const activeSetting = selectedSettingId 
        ? settings.find(s => s.id === selectedSettingId) 
        : undefined;

      const updatedConfiguration: Configuration = {
        id: configuration?.id || crypto.randomUUID(),
        parentId: currentNode.id,
        componentType,
        componentSubType,
        label,
        setting,
        settings,
        activeSetting: activeSetting || null,
        createdBy: configuration?.createdBy || 'User1',
        updateBy: 'User1',
        createTime: configuration?.createTime || new Date().toISOString(),
        updateTime: new Date().toISOString(),
        canOverride: configuration?.canOverride ?? true,
        sourceNode: currentNode.name
      };

      onSave(updatedConfiguration);
      onOpenChange(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON format');
    }
  };

  const handleEditorValidation = (markers: any) => {
    setJsonError(markers.length > 0 ? 'Invalid JSON format' : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-white dark:bg-[#1C1C1F] border-[#e5e5e5] dark:border-[#2A2A2F]">
        <DialogHeader>
          <DialogTitle className="text-[#1e1e1e] dark:text-white">
            {configuration ? 'Edit Configuration' : currentNode ? `Add New Configuration for ${currentNode.name}` : 'Add New Configuration'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 h-full overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="componentType" className="text-[#1e1e1e] dark:text-white">Component Type</Label>
            <Input
              id="componentType"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              placeholder="Enter component type"
              className="bg-white border-[#e5e5e5] text-[#1e1e1e] placeholder-[#767676] dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="componentSubType" className="text-[#1e1e1e] dark:text-white">Component Sub-Type</Label>
            <Input
              id="componentSubType"
              value={componentSubType}
              onChange={(e) => setComponentSubType(e.target.value)}
              placeholder="Enter component sub-type"
              className="bg-white border-[#e5e5e5] text-[#1e1e1e] placeholder-[#767676] dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label" className="text-[#1e1e1e] dark:text-white">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter label"
              className="bg-white border-[#e5e5e5] text-[#1e1e1e] placeholder-[#767676] dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#1e1e1e] dark:text-white">Setting (JSON)</Label>
            <div className="border border-[#e5e5e5] dark:border-[#2A2A2F] dark:border-opacity-50 rounded-md overflow-hidden h-48">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={settingJson}
                onChange={(value) => setSettingJson(value || '{}')}
                options={{
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  theme: theme === 'dark' ? 'vs-dark' : 'vs',
                  fontSize: 13,
                  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                  lineHeight: 20,
                  padding: { top: 8, bottom: 8 },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'all',
                  cursorStyle: 'line',
                  cursorWidth: 2,
                  tabSize: 2,
                  bracketPairColorization: {
                    enabled: true,
                  },
                  renderLineHighlightOnlyWhenFocus: true,
                  lineNumbers: 'on',
                  lineDecorationsWidth: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  contextmenu: false,
                }}
                className="[&_.monaco-editor]:bg-white dark:[&_.monaco-editor]:bg-[#141517] [&_.monaco-editor_.margin]:bg-white dark:[&_.monaco-editor_.margin]:bg-[#141517]"
                onValidate={handleEditorValidation}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1e1e1e] dark:text-white">Settings Array (JSON)</Label>
            <div className="border border-[#e5e5e5] dark:border-[#2A2A2F] dark:border-opacity-50 rounded-md overflow-hidden h-48">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={settingsJson}
                onChange={(value) => setSettingsJson(value || '[]')}
                options={{
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  theme: theme === 'dark' ? 'vs-dark' : 'vs',
                  fontSize: 13,
                  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                  lineHeight: 20,
                  padding: { top: 8, bottom: 8 },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'all',
                  cursorStyle: 'line',
                  cursorWidth: 2,
                  tabSize: 2,
                  bracketPairColorization: {
                    enabled: true,
                  },
                  renderLineHighlightOnlyWhenFocus: true,
                  lineNumbers: 'on',
                  lineDecorationsWidth: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  contextmenu: false,
                }}
                className="[&_.monaco-editor]:bg-white dark:[&_.monaco-editor]:bg-[#141517] [&_.monaco-editor_.margin]:bg-white dark:[&_.monaco-editor_.margin]:bg-[#141517]"
                onValidate={handleEditorValidation}
              />
            </div>
          </div>
          {parsedSettings.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#1e1e1e] dark:text-white">Active Setting</Label>
              <Select
                value={selectedSettingId}
                onValueChange={setSelectedSettingId}
              >
                <SelectTrigger className="bg-white border-[#e5e5e5] text-[#1e1e1e] dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white">
                  <SelectValue placeholder="Select active setting" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e5e5] dark:bg-[#1C1C1F] dark:border-[#2A2A2F]">
                  {parsedSettings.map((setting) => (
                    <SelectItem 
                      key={setting.id} 
                      value={setting.id}
                      className="text-[#1e1e1e] hover:bg-[#f3f3f3] dark:text-white dark:focus:bg-[#2A2A35]"
                    >
                      {setting.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {jsonError && (
            <div className="text-red-500 text-sm dark:text-red-400">{jsonError}</div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white border-[#e5e5e5] text-[#1e1e1e] hover:bg-[#f3f3f3] hover:border-[#d4d4d4] dark:bg-[#2A2A35] dark:border-[#3A3A45] dark:text-white dark:hover:bg-[#3A3A45]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!componentType || !componentSubType || !label || jsonError}
            className="bg-[#0066b8] border-[#0066b8] text-white hover:bg-[#005ba4] hover:border-[#005ba4] dark:bg-[#3B82F6] dark:border-[#2563EB] dark:text-white dark:hover:bg-[#2563EB] dark:disabled:bg-[#2A2A35] dark:disabled:border-[#3A3A45]"
          >
            {configuration ? 'Save Changes' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 