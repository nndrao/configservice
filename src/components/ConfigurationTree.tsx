import React, { useCallback, memo } from 'react';
import { ConfigNode } from '@/types/config';
import { FolderIcon, UserIcon, Building2Icon, GlobeIcon, HomeIcon, UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationTreeProps {
  nodes: ConfigNode[];
  selectedNode: ConfigNode | null;
  onNodeSelect: (node: ConfigNode | null) => void;
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
  selectedNode
}: {
  node: ConfigNode;
  level: number;
  onSelect: (node: ConfigNode | null) => void;
  selectedNode: ConfigNode | null;
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode ? node.id === selectedNode.id : false;
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // If the node is already selected, deselect it by passing null
    onSelect(isSelected ? null : node);
  }, [node, onSelect, isSelected]);

  return (
    <div className="relative">
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

      {hasChildren && (
        <div className="relative">
          {node.children?.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedNode={selectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export function ConfigurationTree({ nodes, selectedNode, onNodeSelect }: ConfigurationTreeProps) {
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking the background, not a node
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
      {/* Clear Selection option allows deselecting a node */}
      <div
        className="py-1 cursor-pointer text-sm text-zinc-500 hover:bg-zinc-100"
        onClick={() => onNodeSelect(null)}
      >
        Clear Selection
      </div>
      {nodes.map((node, index) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onSelect={onNodeSelect}
          selectedNode={selectedNode}
        />
      ))}
    </div>
  );
}