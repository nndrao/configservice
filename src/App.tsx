import React, { useState, useMemo, useEffect } from 'react';
import { ConfigurationTree } from '@/components/ConfigurationTree';
import { ConfigurationGrid } from '@/components/ConfigurationGrid';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';
import { MoveConfigurationsDialog } from '@/components/MoveConfigurationsDialog';
import { CopyConfigurationsDialog } from '@/components/CopyConfigurationsDialog';
import { Button } from '@/components/ui/button';
import { ConfigNode, Configuration } from '@/types/config';
import { Sun, Moon, Plus, Copy, Trash2, Move } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfigurationDialog } from '@/components/ConfigurationDialog';
import './App.css';

// Initial mock data
const initialNodes: ConfigNode[] = [
  {
    id: '1',
    name: 'Application1',
    type: 'application',
    parentId: null,
    children: [
      {
        id: '2',
        name: 'Region1',
        type: 'region',
        parentId: '1',
        children: [
          {
            id: '3',
            name: 'City1',
            type: 'city',
            parentId: '2',
            children: [
              {
                id: '4',
                name: 'Department1',
                type: 'department',
                parentId: '3',
                children: [
                  {
                    id: '5',
                    name: 'Desk1',
                    type: 'desk',
                    parentId: '4',
                    children: [
                      {
                        id: '6',
                        name: 'User1',
                        type: 'user',
                        parentId: '5',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const initialConfigurations: Configuration[] = [
  {
    id: '1',
    parentId: '6',
    componentType: 'Display',
    componentSubType: 'Monitor',
    label: 'Primary Monitor',
    setting: { resolution: '1920x1080' },
    settings: { width: 1920, height: 1080 },
    activeSetting: { currentResolution: '1920x1080', brightness: 80, contrast: 75 },
    createdBy: 'System',
    updateBy: 'Admin',
    createTime: '2024-01-01',
    updateTime: '2024-01-02',
    canOverride: true,
    sourceNode: 'User1'
  },
  {
    id: '2',
    parentId: '1',
    componentType: 'System',
    componentSubType: 'Application',
    label: 'App Settings',
    setting: { theme: 'dark' },
    settings: { mode: 'dark', accent: 'blue' },
    activeSetting: { currentTheme: 'dark', fontSize: '14px', language: 'en' },
    createdBy: 'System',
    updateBy: 'Admin',
    createTime: '2024-01-01',
    updateTime: '2024-01-02',
    canOverride: true,
    sourceNode: 'Application1'
  },
];

function App() {
  const [nodes, setNodes] = useState<ConfigNode[]>(initialNodes);
  const [configurations, setConfigurations] = useState<Configuration[]>(initialConfigurations);
  const [selectedNode, setSelectedNode] = useState<ConfigNode | null>(initialNodes[0]);
  const [selectedConfigs, setSelectedConfigs] = useState<Configuration[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addConfigDialogOpen, setAddConfigDialogOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Theme toggle handler
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Helper function to get parent chain (from root to current node)
  const getParentChain = (nodeId: string): ConfigNode[] => {
    const chain: ConfigNode[] = [];
    let currentId = nodeId;
    
    const findNodeById = (nodes: ConfigNode[]): ConfigNode | null => {
      for (const node of nodes) {
        if (node.id === currentId) return node;
        if (node.children) {
          const found = findNodeById(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    while (currentId) {
      const node = findNodeById(nodes);
      if (node) {
        chain.unshift(node); // Add to front to maintain root->leaf order
        currentId = node.parentId || '';
      } else {
        break;
      }
    }
    
    return chain;
  };

  // Filter configurations based on selected node
  const filteredConfigurations = useMemo(() => {
    if (!selectedNode) return [];

    // Get the chain of nodes from root to current node
    const nodeChain = getParentChain(selectedNode.id);
    const nodeIds = new Set(nodeChain.map(node => node.id));
    
    // Show all configurations from the current node and its ancestors
    return configurations
      .filter(config => nodeIds.has(config.parentId))
      .map(config => ({
        ...config,
        sourceNode: nodeChain.find(node => node.id === config.parentId)?.name || config.sourceNode
      }));
  }, [selectedNode, nodes, configurations]);

  const currentApplication = useMemo(() => {
    if (!selectedNode) return initialNodes[0];
    // Get the chain of nodes from root to current node
    const chain = getParentChain(selectedNode.id);
    return chain[0] || initialNodes[0];
  }, [selectedNode]);

  const handleCreateNode = (type: string, name: string) => {
    const newNode: ConfigNode = {
      id: crypto.randomUUID(),
      name,
      type: type as ConfigNode['type'],
      parentId: selectedNode?.id || null,
      children: [],
    };

    if (!selectedNode) {
      setNodes([...nodes, newNode]);
    } else {
      const updateNodes = (nodes: ConfigNode[]): ConfigNode[] => {
        return nodes.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              children: [...(node.children || []), newNode],
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNodes(node.children),
            };
          }
          return node;
        });
      };

      setNodes(updateNodes(nodes));
    }
    setCreateDialogOpen(false);
  };

  const handleMoveConfigurations = (destinationNode: ConfigNode) => {
    // When moving, keep the same IDs but update parentId
    const movedConfigurations = selectedConfigs.map(config => ({
      ...config,
      parentId: destinationNode.id,
      sourceNode: destinationNode.name
    }));

    // Update configurations, replacing old ones with moved ones
    const updatedConfigurations = configurations.map(config => 
      movedConfigurations.find(moved => moved.id === config.id) || config
    );

    setConfigurations(updatedConfigurations);
    setSelectedConfigs([]);
    setMoveDialogOpen(false);
    setSelectedNode(destinationNode);
  };

  const handleCopyConfigurations = (destinationNode: ConfigNode) => {
    // Allow copying rows within the same node. When copying, generate new IDs. This supports copying rows even when the destination node is the same as the current node.
    const copiedConfigurations = selectedConfigs.map(config => ({
      ...config,
      id: crypto.randomUUID(), // Generate new ID for copied configurations
      parentId: destinationNode.id,
      sourceNode: destinationNode.name
    }));

    // Add copied configurations to existing ones
    setConfigurations([...configurations, ...copiedConfigurations]);
    setSelectedConfigs([]);
    setCopyDialogOpen(false);
    setSelectedNode(destinationNode);
  };

  const handleDeleteConfigurations = () => {
    const selectedIds = new Set(selectedConfigs.map(config => config.id));
    setConfigurations(configurations.filter(config => !selectedIds.has(config.id)));
    setSelectedConfigs([]);
    setDeleteDialogOpen(false);
  };

  const handleSelectionChanged = (selectedRows: Configuration[]) => {
    setSelectedConfigs(selectedRows);
  };

  const handleAddConfiguration = (newConfiguration: Configuration) => {
    setConfigurations([...configurations, newConfiguration]);
  };

  const handleUpdateNode = (updatedNode: ConfigNode) => {
    const updateNodes = (nodes: ConfigNode[]): ConfigNode[] => {
      return nodes.map((node) => {
        if (node.id === updatedNode.id) {
          return { ...node, name: updatedNode.name };
        }
        if (node.children) {
          return {
            ...node,
            children: updateNodes(node.children),
          };
        }
        return node;
      });
    };

    setNodes(updateNodes(nodes));
  };

  const handleDeleteNode = (nodeId: string) => {
    const deleteNode = (nodes: ConfigNode[]): ConfigNode[] => {
      return nodes.filter((node) => {
        if (node.id === nodeId) {
          // Also delete all configurations associated with this node
          setConfigurations(prev => prev.filter(config => config.parentId !== nodeId));
          return false;
        }
        if (node.children) {
          node.children = deleteNode(node.children);
        }
        return true;
      });
    };

    setNodes(deleteNode(nodes));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleNodeSelect = (node: ConfigNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setAddConfigDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen theme-transition" data-theme={theme}>
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex-none">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuration Services</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 button-hover-effect dark:text-white"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col overflow-hidden">
          <Button 
            className="mb-4 w-full shadow-sm hover:shadow-md transition-shadow flex-none button-hover-effect dark:bg-gray-800 dark:text-white" 
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Node
          </Button>

          <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 tree-container">
            <ConfigurationTree
              nodes={nodes}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onCreateNode={handleCreateNode}
              onAddConfiguration={() => setAddConfigDialogOpen(true)}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-none">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Settings for <span className="font-semibold">{selectedNode ? selectedNode.name : 'No node selected'}</span>
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddConfigDialogOpen(true)}
                  disabled={!selectedNode}
                  className="shadow-sm hover:shadow-md transition-all button-hover-effect dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Configuration
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const duplicatedConfigs = selectedConfigs.map(config => ({
                      ...config,
                      id: crypto.randomUUID(),
                    }));
                    setConfigurations([...configurations, ...duplicatedConfigs]);
                    setSelectedConfigs([]);
                  }}
                  disabled={selectedConfigs.length === 0}
                  className="shadow-sm hover:shadow-md transition-all button-hover-effect dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Clone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMoveDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="shadow-sm hover:shadow-md transition-all button-hover-effect dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCopyDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="shadow-sm hover:shadow-md transition-all button-hover-effect dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm hover:shadow-md transition-all button-hover-effect dark:hover:bg-red-900/50 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <ConfigurationGrid
                configurations={filteredConfigurations}
                selectedNode={selectedNode || undefined}
                onSelectionChanged={(updatedConfigurations) => {
                  if (Array.isArray(updatedConfigurations)) {
                    setSelectedConfigs(updatedConfigurations);
                  } else {
                    setConfigurations(prev => 
                      prev.map(config => 
                        config.id === updatedConfigurations.id ? updatedConfigurations : config
                      )
                    );
                  }
                }}
                nodes={nodes}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 flex-none">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Configuration Services. All rights reserved.
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0
          </div>
        </div>
      </footer>

      <CreateNodeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateNode={handleCreateNode}
        selectedNode={selectedNode ?? undefined}
        existingNodes={nodes}
      />

      <MoveConfigurationsDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        nodes={nodes}
        currentNode={selectedNode ? selectedNode : initialNodes[0]}
        currentApplication={currentApplication!}
        onMove={handleMoveConfigurations}
      />

      <CopyConfigurationsDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        nodes={nodes}
        currentNode={selectedNode ? selectedNode : initialNodes[0]}
        currentApplication={currentApplication!}
        onCopy={handleCopyConfigurations}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected configurations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfigurations}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfigurationDialog
        open={addConfigDialogOpen}
        onOpenChange={setAddConfigDialogOpen}
        onSave={handleAddConfiguration}
        currentNode={selectedNode!}
        configuration={undefined}
      />
    </div>
  );
}

export default App;