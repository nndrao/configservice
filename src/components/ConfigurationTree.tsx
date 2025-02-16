import React, { useCallback, memo } from 'react';
import { ConfigNode } from '@/types/config';
import { FolderIcon, UserIcon, Building2Icon, GlobeIcon, HomeIcon, UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationTreeProps {
  nodes: ConfigNode[];
  onNodeSelect: (node: ConfigNode | undefined) => void;
  selectedNode?: ConfigNode;
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
  onNodeSelect, 
  selectedNode,
  isLastChild 
}: {
  node: ConfigNode;
  level: number;
  onNodeSelect: (node: ConfigNode | undefined) => void;
  selectedNode?: ConfigNode;
  isLastChild: boolean;
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.id === node.id;
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // If the node is already selected, deselect it by passing undefined
    onNodeSelect(isSelected ? undefined : node);
  }, [node, onNodeSelect, isSelected]);

  return (
    <div className="relative">
      {/* Vertical line from parent */}
      {level > 0 && (
        <div 
          className="absolute left-[7px] w-px bg-zinc-200" 
          style={{ 
            top: 0,
            height: isLastChild ? '16px' : '100%',
          }}
        />
      )}
      
      <div
        className={cn(
          "relative py-1 cursor-pointer group",
          "hover:bg-zinc-100 rounded transition-colors",
          isSelected && "bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200"
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${Math.min(level * 20, 200)}px` }}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren}
      >
        {/* Horizontal line to node */}
        {level > 0 && (
          <div 
            className="absolute left-[7px] h-px bg-zinc-200" 
            style={{ 
              width: '12px',
              top: '16px',
            }}
          />
        )}
        
        <div className="flex items-center gap-2 px-2 relative">
          <div className="relative z-10 bg-white p-1">
            <NodeIcon type={node.type} />
          </div>
          <span className={cn(
            "text-sm transition-colors",
            isSelected ? "text-blue-900 font-medium" : "text-zinc-700",
            "group-hover:text-zinc-900"
          )}>
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
              onNodeSelect={onNodeSelect}
              selectedNode={selectedNode}
              isLastChild={index === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export function ConfigurationTree({ nodes, onNodeSelect, selectedNode }: ConfigurationTreeProps) {
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking the background, not a node
    if (e.target === e.currentTarget) {
      onNodeSelect(undefined);
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
      {nodes.map((node, index) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onNodeSelect={onNodeSelect}
          selectedNode={selectedNode}
          isLastChild={index === nodes.length - 1}
        />
      ))}
    </div>
  );
}