import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfigNode } from '@/types/config';
import { cn } from '@/lib/utils';
import { Building2Icon, GlobeIcon, HomeIcon, UsersIcon, FolderIcon, UserIcon } from 'lucide-react';

interface MoveConfigurationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: ConfigNode[];
  currentNode: ConfigNode;
  onMove: (destinationNode: ConfigNode) => void;
  currentApplication: ConfigNode;
}

const NodeIcon = ({ type }: { type: string }) => {
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
};

const TreeNode = ({ 
  node, 
  level, 
  onSelect,
  currentNode,
  currentApplication,
  isLastChild 
}: {
  node: ConfigNode;
  level: number;
  onSelect: (node: ConfigNode) => void;
  currentNode: ConfigNode;
  currentApplication: ConfigNode;
  isLastChild: boolean;
}) => {
  const isDisabled = node.id === currentNode.id || (node.type === 'application' && node.id !== currentApplication.id);

  return (
    <div className="relative">
      <div
        className={cn(
          "relative py-1 group tree-node",
          !isDisabled && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2A2A35] dark:hover:border-[#3A3A45]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isDisabled && onSelect(node)}
        style={{ paddingLeft: `${Math.min(level * 20, 200)}px` }}
        role="button"
        aria-disabled={isDisabled}
      >
        <div className="flex items-center gap-2 px-2 relative">
          <div className="relative z-10 bg-transparent p-1 dark:bg-opacity-3">
            <NodeIcon type={node.type} />
          </div>
          <span className={cn(
            "text-sm transition-colors tree-node-text",
            !isDisabled && "group-hover:text-zinc-900 dark:group-hover:text-white",
            isDisabled ? "text-zinc-400" : "text-zinc-700 dark:text-[#E5E7EB]"
          )}>
            {node.name}
          </span>
        </div>
      </div>

      {node.children && (
        <div className="relative">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              currentNode={currentNode}
              currentApplication={currentApplication}
              isLastChild={index === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function MoveConfigurationsDialog({
  open,
  onOpenChange,
  nodes,
  currentNode,
  onMove,
  currentApplication,
}: MoveConfigurationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Configurations</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-zinc-500 mb-4">
            Select a destination node (within the same application) to move the selected configurations
          </div>
          <div className="border rounded-lg max-h-[400px] overflow-auto">
            {nodes.map((node, index) => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                onSelect={onMove}
                currentNode={currentNode}
                currentApplication={currentApplication}
                isLastChild={index === nodes.length - 1}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}