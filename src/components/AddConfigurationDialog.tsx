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
import { ConfigurationTree } from './ConfigurationTree';

interface AddConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (configuration: Configuration) => void;
  nodes: ConfigNode[];
  currentNode: ConfigNode;
}

export function AddConfigurationDialog({
  open,
  onOpenChange,
  onSave,
  nodes,
  currentNode,
}: AddConfigurationDialogProps) {
  const [componentType, setComponentType] = useState('');
  const [componentSubType, setComponentSubType] = useState('');
  const [label, setLabel] = useState('');
  const [settingJson, setSettingJson] = useState('{}');
  const [settingsJson, setSettingsJson] = useState('[]');
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [selectedNode, setSelectedNode] = useState<ConfigNode>(currentNode);
  const [parsedSettings, setParsedSettings] = useState<Array<{ id: string }>>([]);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    try {
      const settings = JSON.parse(settingsJson);
      if (Array.isArray(settings)) {
        setParsedSettings(settings);
        setJsonError('');
      } else {
        setJsonError('Settings must be an array of objects with id property');
      }
    } catch (e) {
      setJsonError('Invalid JSON format');
      setParsedSettings([]);
    }
  }, [settingsJson]);

  const handleSave = () => {
    try {
      // Validate settings JSON format
      const settings = JSON.parse(settingsJson);
      if (!Array.isArray(settings) || !settings.every(s => typeof s.id === 'string')) {
        throw new Error('Settings must be an array of objects with id property');
      }

      // Validate setting JSON
      const setting = JSON.parse(settingJson);

      // Generate unique ID
      const uniqueId = crypto.randomUUID();
      const id = `${componentType}-${componentSubType}-${uniqueId}`.toLowerCase();

      const newConfiguration: Configuration = {
        id,
        parentId: selectedNode.id,
        componentType,
        componentSubType,
        label,
        setting,
        settings,
        activeSetting: settings.find(s => s.id === selectedSettingId) || settings[0],
        createdBy: 'User1',
        updateBy: 'User1',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        canOverride: true,
        sourceNode: selectedNode.name
      };

      onSave(newConfiguration);
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
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add New Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4 h-full overflow-hidden">
          <div className="flex flex-col gap-4 overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="componentType">Component Type</Label>
              <Input
                id="componentType"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                placeholder="Enter component type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="componentSubType">Component Sub-Type</Label>
              <Input
                id="componentSubType"
                value={componentSubType}
                onChange={(e) => setComponentSubType(e.target.value)}
                placeholder="Enter component sub-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter label"
              />
            </div>
            <div className="space-y-2">
              <Label>Setting (JSON)</Label>
              <div className="border rounded-md overflow-hidden h-48">
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
                  }}
                  onValidate={handleEditorValidation}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Settings Array (JSON)</Label>
              <div className="border rounded-md overflow-hidden h-48">
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
                  }}
                  onValidate={handleEditorValidation}
                />
              </div>
            </div>
            {parsedSettings.length > 0 && (
              <div className="space-y-2">
                <Label>Active Setting</Label>
                <Select
                  value={selectedSettingId}
                  onValueChange={setSelectedSettingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select active setting" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedSettings.map((setting) => (
                      <SelectItem key={setting.id} value={setting.id}>
                        {setting.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {jsonError && (
              <div className="text-red-500 text-sm">{jsonError}</div>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <Label>Select Target Node</Label>
            </div>
            <div className="p-2 h-full overflow-auto">
              <ConfigurationTree
                nodes={nodes}
                selectedNode={selectedNode}
                onNodeSelect={(node) => node && setSelectedNode(node)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!componentType || !componentSubType || !label || jsonError}
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 