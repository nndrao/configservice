import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
}

interface TreeProps {
  data: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
  selectedId?: string;
}

export function Tree({ data, onNodeSelect, selectedId }: TreeProps) {
  return (
    <div className="space-y-0.5">
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onNodeSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  onSelect?: (node: TreeNode) => void;
  selectedId?: string;
}

function TreeNode({ node, level = 0, onSelect, selectedId }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelect?.(node)}
        className={cn(
          'w-full justify-start gap-2 font-normal h-8 px-2 text-sm',
          'hover:bg-zinc-100 hover:text-zinc-900',
          level > 0 && 'ml-4',
          selectedId === node.id && 'bg-zinc-100 text-zinc-900'
        )}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform text-zinc-500',
              isExpanded && 'rotate-90'
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        )}
        {!hasChildren && <div className="w-4" />}
        {node.icon}
        <span className="truncate">{node.name}</span>
      </Button>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}