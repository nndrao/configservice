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
import { nodeOperations, configOperations } from '@/utils/database';
import './App.css';

function App() {
  const [nodes, setNodes] = useState<ConfigNode[]>([]);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [selectedNode, setSelectedNode] = useState<ConfigNode | null>(null);
  const [selectedConfigs, setSelectedConfigs] = useState<Configuration[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addConfigDialogOpen, setAddConfigDialogOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load initial data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const nodesFromDb = await nodeOperations.getAll();
        const configsFromDb = await configOperations.getAll();
        setNodes(nodesFromDb);
        setConfigurations(configsFromDb);
        // Set initial selected node to first application if exists
        if (nodesFromDb.length > 0) {
          setSelectedNode(nodesFromDb[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

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
    if (!selectedNode) return nodes[0];
    // Get the chain of nodes from root to current node
    const chain = getParentChain(selectedNode.id);
    return chain[0] || nodes[0];
  }, [selectedNode]);

  const findApplicationId = (nodes: ConfigNode[], targetId: string): string | null => {
    // If the target node is an application, return its ID
    const targetNode = nodes.find(node => node.id === targetId);
    if (targetNode?.type === 'application') {
      return targetNode.id;
    }

    // Otherwise, search through all nodes to find the parent application
    for (const node of nodes) {
      if (node.type === 'application') {
        const hasTargetInChildren = (parent: ConfigNode): boolean => {
          if (parent.id === targetId) return true;
          return parent.children?.some(child => hasTargetInChildren(child)) || false;
        };
        if (hasTargetInChildren(node)) {
          return node.id;
        }
      }
      // If the node has children, recursively search them
      if (node.children?.length) {
        const foundId = findApplicationId(node.children, targetId);
        if (foundId) return foundId;
      }
    }
    return null;
  };

  const isNodeUnique = (nodes: ConfigNode[], type: string, name: string, applicationId: string, nodeIdToIgnore?: string): boolean => {
    const checkNode = (node: ConfigNode): boolean => {
      // If we're in a different application, skip the check
      if (node.type === 'application' && node.id !== applicationId) {
        return true;
      }

      // Check current node, but ignore the node being updated if nodeIdToIgnore is provided
      if (node.type === type && 
          node.name.toLowerCase() === name.toLowerCase() && 
          node.id !== nodeIdToIgnore) {
        return false;
      }

      // Check children recursively
      if (node.children) {
        return node.children.every(child => checkNode(child));
      }

      return true;
    };

    // Find the application node first
    const applicationNode = nodes.find(node => node.type === 'application' && node.id === applicationId);
    if (!applicationNode) return true; // If we can't find the application, assume it's unique

    // Only check within the found application
    return checkNode(applicationNode);
  };

  const handleCreateNode = async (type: string, name: string) => {
    let applicationId: string | null = null;
    
    if (!selectedNode) {
      if (type === 'application') {
        if (!isNodeUnique(nodes, type, name, '')) {
          alert(`An application with the name "${name}" already exists. Please choose a different name.`);
          return;
        }
      } else {
        alert('Please select a parent node first.');
        return;
      }
    } else {
      applicationId = findApplicationId(nodes, selectedNode.id);
      
      if (!applicationId) {
        alert('Could not find parent application. Please try again.');
        return;
      }

      if (!isNodeUnique(nodes, type, name, applicationId)) {
        alert(`A ${type} with the name "${name}" already exists in this application. Please choose a different name.`);
        return;
      }
    }

    const newNode: ConfigNode = {
      id: crypto.randomUUID(),
      name,
      type: type as ConfigNode['type'],
      parentId: selectedNode?.id || null,
      children: [],
    };

    try {
      // Save to database
      await nodeOperations.create(newNode);

      // Update state
      const nodesFromDb = await nodeOperations.getAll();
      setNodes(nodesFromDb);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating node:', error);
      alert('Failed to create node. Please try again.');
    }
  };

  const handleMoveConfigurations = async (destinationNode: ConfigNode) => {
    try {
      // Update configurations in database and state
      for (const config of selectedConfigs) {
        const updatedConfig = {
          ...config,
          parentId: destinationNode.id,
          sourceNode: destinationNode.name,
          updateTime: new Date().toISOString()
        };
        await configOperations.update(updatedConfig);
      }

      // Refresh configurations from database
      const configsFromDb = await configOperations.getAll();
      setConfigurations(configsFromDb);
      setSelectedConfigs([]);
      setMoveDialogOpen(false);
      setSelectedNode(destinationNode);
    } catch (error) {
      console.error('Error moving configurations:', error);
      alert('Failed to move configurations. Please try again.');
    }
  };

  const handleCopyConfigurations = async (destinationNode: ConfigNode) => {
    try {
      // Copy each selected configuration with its references
      for (const config of selectedConfigs) {
        await configOperations.cloneConfigurationWithReferences(config.id, destinationNode.id);
      }

      // Refresh configurations from database
      const configsFromDb = await configOperations.getAll();
      setConfigurations(configsFromDb);
      setSelectedConfigs([]);
      setCopyDialogOpen(false);
      setSelectedNode(destinationNode);
    } catch (error) {
      console.error('Error copying configurations:', error);
      alert('Failed to copy configurations. Please try again.');
    }
  };

  const handleDeleteConfigurations = async () => {
    try {
      // Delete configurations from database
      for (const config of selectedConfigs) {
        await configOperations.delete(config.id);
      }

      // Refresh configurations from database
      const configsFromDb = await configOperations.getAll();
      setConfigurations(configsFromDb);
      setSelectedConfigs([]);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting configurations:', error);
      alert('Failed to delete configurations. Please try again.');
    }
  };

  const handleSelectionChange = async (selectedRows: Configuration | Configuration[]) => {
    if (Array.isArray(selectedRows)) {
      setSelectedConfigs(selectedRows);
    } else {
      try {
        // Update configuration in database
        const updatedConfig = {
          ...selectedRows,
          updateTime: new Date().toISOString()
        };
        await configOperations.update(updatedConfig);
        
        // Refresh configurations from database
        const configsFromDb = await configOperations.getAll();
        setConfigurations(configsFromDb);
      } catch (error) {
        console.error('Error updating configuration:', error);
        alert('Failed to update configuration. Please try again.');
      }
    }
  };

  const handleAddConfiguration = async (newConfiguration: Configuration) => {
    try {
      // Create configuration in database
      await configOperations.create(newConfiguration);
      
      // Refresh configurations from database
      const configsFromDb = await configOperations.getAll();
      setConfigurations(configsFromDb);
    } catch (error) {
      console.error('Error adding configuration:', error);
      alert('Failed to add configuration. Please try again.');
    }
  };

  const handleUpdateNode = async (updatedNode: ConfigNode) => {
    const applicationId = findApplicationId(nodes, updatedNode.id);
    
    if (!applicationId) {
      alert('Could not find parent application. Please try again.');
      return;
    }

    if (!isNodeUnique(nodes, updatedNode.type, updatedNode.name, applicationId, updatedNode.id)) {
      alert(`A ${updatedNode.type} with the name "${updatedNode.name}" already exists in this application. Please choose a different name.`);
      return;
    }

    try {
      // Update node in database
      await nodeOperations.update(updatedNode);

      // Refresh nodes from database
      const nodesFromDb = await nodeOperations.getAll();
      setNodes(nodesFromDb);
    } catch (error) {
      console.error('Error updating node:', error);
      alert('Failed to update node. Please try again.');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      // Delete node and its configurations from database
      await nodeOperations.delete(nodeId);
      await configOperations.deleteByParentId(nodeId);

      // Refresh data from database
      const nodesFromDb = await nodeOperations.getAll();
      const configsFromDb = await configOperations.getAll();
      setNodes(nodesFromDb);
      setConfigurations(configsFromDb);

      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      alert('Failed to delete node. Please try again.');
    }
  };

  const handleNodeSelect = (node: ConfigNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setAddConfigDialogOpen(false);
    }
  };

  const handleSaveChanges = async (modifiedConfigurations: Configuration[]) => {
    try {
      // Update each modified configuration in the database
      for (const config of modifiedConfigurations) {
        await configOperations.update({
          ...config,
          updateTime: new Date().toISOString(),
          updateBy: 'User1' // Add user info
        });
      }

      // Refresh all configurations from database to ensure we have the latest data
      const configsFromDb = await configOperations.getAll();
      setConfigurations(configsFromDb);
      
      // Show success message
      alert('Changes saved successfully');
    } catch (error) {
      console.error('Error saving configurations:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen theme-transition" data-theme={theme}>
      <header className="app-header py-4 px-6 flex-none">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuration Services</h1>
            <div className="badge badge-blue">v1.0.0</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 button-hover-effect dark:text-white tooltip"
            data-tooltip={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
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

          <div className="flex-1 overflow-auto tree-container">
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
          <div className="settings-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="settings-title">
                  {selectedNode ? (
                    <>
                      <span className="text-muted-foreground">Settings for</span>{' '}
                      <span className="font-semibold">{selectedNode.name}</span>
                    </>
                  ) : (
                    'No node selected'
                  )}
                </h2>
                {selectedNode && (
                  <div className="badge badge-green">
                    {selectedNode.type}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddConfigDialogOpen(true)}
                  disabled={!selectedNode}
                  className="action-button"
                  data-tooltip="Add a new configuration"
                >
                  <Plus className="w-4 h-4" />
                  Add Configuration
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (selectedConfigs.length === 0) return;
                    
                    try {
                      // Clone each selected configuration
                      for (const config of selectedConfigs) {
                        await configOperations.cloneConfigurationWithReferences(
                          config.id,
                          config.parentId // Clone to same parent node
                        );
                      }
                      
                      // Refresh configurations from database
                      const configsFromDb = await configOperations.getAll();
                      setConfigurations(configsFromDb);
                      setSelectedConfigs([]);
                    } catch (error) {
                      console.error('Error cloning configurations:', error);
                      alert('Failed to clone configurations. Please try again.');
                    }
                  }}
                  disabled={selectedConfigs.length === 0}
                  className="action-button"
                  data-tooltip="Clone selected configurations"
                >
                  <Copy className="w-4 h-4" />
                  Clone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMoveDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="action-button"
                  data-tooltip="Move selected configurations"
                >
                  <Move className="w-4 h-4" />
                  Move
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCopyDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="action-button"
                  data-tooltip="Copy selected configurations"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={selectedConfigs.length === 0}
                  className="action-button text-red-600 hover:bg-red-50 hover:border-red-200"
                  data-tooltip="Delete selected configurations"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full grid-container">
              <ConfigurationGrid
                configurations={filteredConfigurations}
                selectedNode={selectedNode || undefined}
                onSelectionChanged={handleSelectionChange}
                onSaveChanges={handleSaveChanges}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 flex-none">
        <div className="max-w-full mx-auto flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div>© 2024 Configuration Services. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <div className="status-indicator status-active"></div>
            System Status: Operational
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
        currentNode={selectedNode ? selectedNode : nodes[0]}
        currentApplication={currentApplication!}
        onMove={handleMoveConfigurations}
      />

      <CopyConfigurationsDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        nodes={nodes}
        currentNode={selectedNode ? selectedNode : nodes[0]}
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