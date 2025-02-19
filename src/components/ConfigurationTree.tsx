import React, { useCallback, memo, useState } from 'react';
import { ConfigNode } from '@/types/config';
import { FolderIcon, UserIcon, Building2Icon, GlobeIcon, HomeIcon, UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfigurationTreeProps {
  nodes: ConfigNode[];
  selectedNode: ConfigNode | null;
  onNodeSelect: (node: ConfigNode | null) => void;
  onUpdateNode?: (node: ConfigNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onCreateNode?: (type: string, name: string, parentId: string) => void;
  onAddConfiguration?: (node: ConfigNode) => void;
}

const NodeIcon = memo(({ type }: { type: string }) => {
  switch (type) {
    case 'user':
      return <UserIcon className="h-4 w-4 text-blue-500" />;
    case 'application':
      return <Building2Icon className="h-4 w-4 text-purple-500" />;
    case 'region':
      return <GlobeIcon className="h-4 w-4 text-green-500" />;
    case 'city':
      return <HomeIcon className="h-4 w-4 text-orange-500" />;
    case 'department':
      return <UsersIcon className="h-4 w-4 text-red-500" />;
    case 'desk':
      return <FolderIcon className="h-4 w-4 text-yellow-500" />;
    default:
      return <FolderIcon className="h-4 w-4 text-zinc-500" />;
  }
});

NodeIcon.displayName = 'NodeIcon';

const TreeNode = memo(({ 
  node, 
  level, 
  onSelect, 
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onCreateNode,
  onAddConfiguration
}: {
  node: ConfigNode;
  level: number;
  onSelect: (node: ConfigNode | null) => void;
  selectedNode: ConfigNode | null;
  onUpdateNode?: (node: ConfigNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onCreateNode?: (type: string, name: string, parentId: string) => void;
  onAddConfiguration?: (node: ConfigNode) => void;
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState(node.name);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode ? node.id === selectedNode.id : false;
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(isSelected ? null : node);
  }, [node, onSelect, isSelected]);

  const handleCreateNode = useCallback((type: string) => {
    if (onCreateNode) {
      const newNodeName = `New ${type} ${level + 1}`;
      onCreateNode(type, newNodeName, node.id);
    }
  }, [onCreateNode, node.id, level]);

  const handleUpdateLabel = () => {
    if (onUpdateNode) {
      onUpdateNode({
        ...node,
        name: newLabel
      });
    }
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (onDeleteNode) {
      onDeleteNode(node.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const getAllowedNodeTypes = (currentType: string): string[] => {
    const hierarchy = ['application', 'region', 'city', 'department', 'desk', 'user'];
    const currentIndex = hierarchy.indexOf(currentType);
    
    if (currentIndex === -1 || currentIndex === hierarchy.length - 1) {
      return [];
    }
    
    return hierarchy.slice(currentIndex + 1);
  };

  return (
    <div className="relative">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "relative py-1 cursor-pointer group tree-node",
              "hover:bg-zinc-100 rounded transition-colors",
              isSelected && "selected bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
            )}
            onClick={handleClick}
            style={{ paddingLeft: `${Math.min(level * 20, 200)}px` }}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren}
          >
            <div className="flex items-center gap-2 px-2 relative">
              <div className="relative z-10 bg-transparent p-1">
                <NodeIcon type={node.type} />
              </div>
              <span className="text-sm text-zinc-700 dark:text-[#E5E7EB] transition-colors">
                {node.name}
              </span>
            </div>
          </div>
        </ContextMenuTrigger>
        {isSelected && (
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => setIsEditDialogOpen(true)}>
              Change Label
            </ContextMenuItem>
            {getAllowedNodeTypes(node.type).length > 0 && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>Add New Node</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {getAllowedNodeTypes(node.type).map((type) => (
                    <ContextMenuItem
                      key={type}
                      onSelect={() => handleCreateNode(type)}
                    >
                      Add {type.charAt(0).toUpperCase() + type.slice(1)}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
            <ContextMenuItem onSelect={() => setIsDeleteDialogOpen(true)}>
              Remove Node
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onAddConfiguration && onAddConfiguration(node)}>
              Add Configuration
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      {/* Edit Label Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Label</Label>
            <Input
              id="name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLabel}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the node and all its configurations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasChildren && (
        <div className="relative">
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedNode={selectedNode}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
              onCreateNode={onCreateNode}
              onAddConfiguration={onAddConfiguration}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export function ConfigurationTree({ 
  nodes, 
  selectedNode, 
  onNodeSelect,
  onUpdateNode,
  onDeleteNode,
  onCreateNode,
  onAddConfiguration
}: ConfigurationTreeProps) {
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">
        No nodes available. Create a new application to get started.
      </div>
    );
  }

  return (
    <div 
      className="p-2 select-none h-full" 
      role="tree"
      aria-label="Configuration hierarchy"
      onClick={handleBackgroundClick}
    >
      <div
        className="py-1 cursor-pointer text-sm text-zinc-500 hover:bg-zinc-100"
        onClick={() => onNodeSelect(null)}
      >
        Clear Selection
      </div>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onSelect={onNodeSelect}
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onCreateNode={onCreateNode}
          onAddConfiguration={onAddConfiguration}
        />
      ))}
    </div>
  );
}