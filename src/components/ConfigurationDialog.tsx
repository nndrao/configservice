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

interface ConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (configuration: Configuration) => void;
  nodes: ConfigNode[];
  currentNode: ConfigNode;
  configuration?: Configuration; // Optional configuration for edit mode
}

export function ConfigurationDialog({
  open,
  onOpenChange,
  onSave,
  nodes,
  currentNode,
  configuration,
}: ConfigurationDialogProps) {
  const [componentType, setComponentType] = useState('');
  const [componentSubType, setComponentSubType] = useState('');
  const [label, setLabel] = useState('');
  const [settingJson, setSettingJson] = useState('{}');
  const [settingsJson, setSettingsJson] = useState('[]');
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [selectedNode, setSelectedNode] = useState<ConfigNode>(currentNode);
  const [parsedSettings, setParsedSettings] = useState<Array<{ id: string }>>([]);
  const [jsonError, setJsonError] = useState('');

  // Initialize form with existing configuration data when editing
  useEffect(() => {
    if (configuration) {
      setComponentType(configuration.componentType);
      setComponentSubType(configuration.componentSubType);
      setLabel(configuration.label);
      setSettingJson(JSON.stringify(configuration.setting, null, 2));
      setSettingsJson(JSON.stringify(configuration.settings, null, 2));
      setSelectedSettingId(configuration.activeSetting?.id || '');
      
      // Find and set the node that matches the configuration's parentId
      const findNode = (nodes: ConfigNode[]): ConfigNode | undefined => {
        for (const node of nodes) {
          if (node.id === configuration.parentId) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
      };
      const node = findNode(nodes);
      if (node) setSelectedNode(node);
    } else {
      // Reset form when adding new configuration
      setComponentType('');
      setComponentSubType('');
      setLabel('');
      setSettingJson('{}');
      setSettingsJson('[]');
      setSelectedSettingId('');
      setSelectedNode(currentNode);
    }
  }, [configuration, nodes, currentNode]);

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
        parentId: selectedNode.id,
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
        sourceNode: selectedNode.name
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
      <DialogContent className="max-w-4xl h-[80vh] dark:bg-[#1C1C1F] dark:border-[#2A2A2F]">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {configuration ? 'Edit Configuration' : 'Add New Configuration'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4 h-full overflow-hidden">
          <div className="flex flex-col gap-4 overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="componentType" className="dark:text-white">Component Type</Label>
              <Input
                id="componentType"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                placeholder="Enter component type"
                className="dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="componentSubType" className="dark:text-white">Component Sub-Type</Label>
              <Input
                id="componentSubType"
                value={componentSubType}
                onChange={(e) => setComponentSubType(e.target.value)}
                placeholder="Enter component sub-type"
                className="dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label" className="dark:text-white">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter label"
                className="dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Setting (JSON)</Label>
              <div className="border rounded-md overflow-hidden h-48 dark:border-[#2A2A2F] dark:border-opacity-50">
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
                    theme: 'vs-dark',
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
                  className="dark:[&_.monaco-editor]:bg-[#141517] dark:[&_.monaco-editor_.margin]:bg-[#141517]"
                  onValidate={handleEditorValidation}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Settings Array (JSON)</Label>
              <div className="border rounded-md overflow-hidden h-48 dark:border-[#2A2A2F] dark:border-opacity-50">
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
                    theme: 'vs-dark',
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
                  className="dark:[&_.monaco-editor]:bg-[#141517] dark:[&_.monaco-editor_.margin]:bg-[#141517]"
                  onValidate={handleEditorValidation}
                />
              </div>
            </div>
            {parsedSettings.length > 0 && (
              <div className="space-y-2">
                <Label className="dark:text-white">Active Setting</Label>
                <Select
                  value={selectedSettingId}
                  onValueChange={setSelectedSettingId}
                >
                  <SelectTrigger className="dark:bg-[#141517] dark:border-[#2A2A2F] dark:text-white">
                    <SelectValue placeholder="Select active setting" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1C1C1F] dark:border-[#2A2A2F]">
                    {parsedSettings.map((setting) => (
                      <SelectItem 
                        key={setting.id} 
                        value={setting.id}
                        className="dark:text-white dark:focus:bg-[#2A2A35]"
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
          <div className="border rounded-lg overflow-hidden dark:border-[#2A2A2F]">
            <div className="p-4 border-b bg-gray-50 dark:bg-[#1C1C1F] dark:border-[#2A2A2F]">
              <Label className="dark:text-white">Select Target Node</Label>
            </div>
            <div className="p-2 h-full overflow-auto dark:bg-[#141517]">
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
            className="dark:bg-[#2A2A35] dark:border-[#3A3A45] dark:text-white dark:hover:bg-[#3A3A45]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!componentType || !componentSubType || !label || jsonError}
            className="dark:bg-[#3B82F6] dark:border-[#2563EB] dark:text-white dark:hover:bg-[#2563EB] dark:disabled:bg-[#2A2A35] dark:disabled:border-[#3A3A45]"
          >
            {configuration ? 'Save Changes' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 