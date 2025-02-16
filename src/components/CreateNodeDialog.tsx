import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfigNode } from '@/types/config';

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNode: (type: string, name: string) => void;
  selectedNode: ConfigNode | undefined;
  existingNodes: ConfigNode[];
}

const NODE_TYPES = {
  application: { label: 'Application', allowedParents: [] },
  region: { label: 'Region', allowedParents: ['application'] },
  city: { label: 'City', allowedParents: ['application', 'region'] },
  department: { label: 'Department', allowedParents: ['application', 'region', 'city'] },
  desk: { label: 'Desk', allowedParents: ['application', 'region', 'city', 'department'] },
  user: { label: 'User', allowedParents: ['application', 'region', 'city', 'department','desk'] },
} as const;

export function CreateNodeDialog({
  open,
  onOpenChange,
  onCreateNode,
  selectedNode,
  existingNodes,
}: CreateNodeDialogProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableTypes = useMemo(() => {
    if (!selectedNode) {
      return ['application'];
    }

    return Object.entries(NODE_TYPES)
      .filter(([type, config]) => {
        if (type === 'application') return false;
        return config.allowedParents.includes(selectedNode.type);
      })
      .map(([type]) => type);
  }, [selectedNode]);

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (selectedType === 'application') {
      const applicationExists = existingNodes.some(
        (node) => node.type === 'application' && node.name.toLowerCase() === name.toLowerCase()
      );
      if (applicationExists) {
        setError('An application with this name already exists');
        return;
      }
    }

    onCreateNode(selectedType, name.trim());
    setName('');
    setSelectedType('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Node</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Node Type</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                setError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select node type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {NODE_TYPES[type as keyof typeof NODE_TYPES].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={`Enter ${selectedType ? NODE_TYPES[selectedType as keyof typeof NODE_TYPES].label.toLowerCase() : 'node'} name`}
            />
          </div>
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedType || !name.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}