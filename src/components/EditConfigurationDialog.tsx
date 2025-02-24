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
import Editor, { BeforeMount } from '@monaco-editor/react';

export function EditConfigurationDialog({
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
  const [settingJson, setSettingJson] = useState('{\n  \n}');
  const [activeSettingJson, setActiveSettingJson] = useState('{\n  \n}');
  const [jsonError, setJsonError] = useState('');

  // Initialize form with existing configuration data when editing
  useEffect(() => {
    if (configuration) {
      setComponentType(configuration.componentType);
      setComponentSubType(configuration.componentSubType);
      setLabel(configuration.label);
      setSettingJson(JSON.stringify(configuration.setting, null, 2));
      setActiveSettingJson(JSON.stringify(configuration.activeSetting, null, 2));
    } else {
      // Reset form when adding new configuration
      setComponentType('');
      setComponentSubType('');
      setLabel('');
      setSettingJson('{\n  \n}');
      setActiveSettingJson('{\n  \n}');
    }
  }, [configuration]);

  const handleSave = () => {
    try {
      // Validate setting JSON
      const setting = JSON.parse(settingJson);
      const activeSetting = JSON.parse(activeSettingJson);

      const updatedConfiguration: Configuration = {
        id: configuration?.id || crypto.randomUUID(),
        parentId: currentNode.id,
        componentType,
        componentSubType,
        label,
        setting,
        activeSetting,
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

  // Define custom dark theme for Monaco editor
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('customDarkTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: 'E06C75' },   // Property names in red
        { token: 'string.value.json', foreground: '98C379' }, // String values in green
        { token: 'number', foreground: 'D19A66' },            // Numbers in orange
        { token: 'keyword', foreground: 'ABB2BF' },           // Brackets, commas, colons in light gray
        { token: 'delimiter', foreground: 'ABB2BF' },         // Brackets, commas, colons in light gray
        { token: 'operator', foreground: 'ABB2BF' },          // Colons in light gray
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#ABB2BF',
        'editorLineNumber.foreground': '#495162',
        'editorLineNumber.activeForeground': '#ABB2BF',
        'editor.selectionBackground': '#3E4452',
        'editor.inactiveSelectionBackground': '#3E4452',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#2C313A',
        'scrollbarSlider.background': '#4B5364',
        'scrollbarSlider.hoverBackground': '#5A6379',
        'scrollbarSlider.activeBackground': '#747D91',
      }
    });
  };

  const editorOptions = {
    minimap: { enabled: false },
    formatOnPaste: true,
    formatOnType: true,
    automaticLayout: true,
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    lineHeight: 20,
    padding: { top: 8, bottom: 8 },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    cursorStyle: 'line',
    cursorWidth: 2,
    tabSize: 2,
    bracketPairColorization: {
      enabled: false,
    },
    lineNumbers: 'on',
    lineDecorationsWidth: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    contextmenu: false,
    readOnly: false,
    wordWrap: 'on',
    guides: {
      indentation: false,
      bracketPairs: false,
    },
    colorDecorators: true,
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
                onChange={(value) => setSettingJson(value || '{\n  \n}')}
                options={editorOptions}
                theme="customDarkTheme"
                beforeMount={beforeMount}
                className="[&_.monaco-editor]:bg-[#1E1E1E] [&_.monaco-editor_.margin]:bg-[#1E1E1E]"
                onValidate={handleEditorValidation}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#1e1e1e] dark:text-white">Active Setting (JSON)</Label>
            <div className="border border-[#e5e5e5] dark:border-[#2A2A2F] dark:border-opacity-50 rounded-md overflow-hidden h-48">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={activeSettingJson}
                onChange={(value) => setActiveSettingJson(value || '{\n  \n}')}
                options={editorOptions}
                theme="customDarkTheme"
                beforeMount={beforeMount}
                className="[&_.monaco-editor]:bg-[#1E1E1E] [&_.monaco-editor_.margin]:bg-[#1E1E1E]"
                onValidate={handleEditorValidation}
              />
            </div>
          </div>
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