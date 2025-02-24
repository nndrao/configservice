import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { database, nodeOperations, configOperations } from '@/utils/database';
import { Button } from '@/components/ui/button';

export function DatabaseViewer() {
  const [nodesData, setNodesData] = useState<any[]>([]);
  const [configurationsData, setConfigurationsData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'nodes' | 'configurations'>('nodes');

  useEffect(() => {
    const loadData = async () => {
      try {
        const nodes = await nodeOperations.getAll();
        const configs = await configOperations.getAll();
        
        // Flatten nodes for grid display
        const flatNodes = flattenNodes(nodes);
        setNodesData(flatNodes);
        setConfigurationsData(configs);
      } catch (error) {
        console.error('Error loading database data:', error);
      }
    };

    loadData();
  }, []);

  // Helper function to flatten the node tree
  const flattenNodes = (nodes: any[], parentPath = ''): any[] => {
    return nodes.reduce((acc: any[], node) => {
      const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
      const flatNode = { ...node, path: currentPath };
      delete flatNode.children;
      
      acc.push(flatNode);
      
      if (node.children && node.children.length > 0) {
        acc.push(...flattenNodes(node.children, currentPath));
      }
      
      return acc;
    }, []);
  };

  const nodeColumnDefs = useMemo<ColDef[]>(() => [
    { field: 'id', headerName: 'ID', filter: true, sortable: true },
    { field: 'name', headerName: 'Name', filter: true, sortable: true },
    { field: 'type', headerName: 'Type', filter: true, sortable: true },
    { field: 'parentId', headerName: 'Parent ID', filter: true, sortable: true },
    { field: 'path', headerName: 'Path', filter: true, sortable: true },
  ], []);

  const configColumnDefs = useMemo<ColDef[]>(() => [
    { field: 'id', headerName: 'ID', filter: true, sortable: true },
    { field: 'parentId', headerName: 'Parent ID', filter: true, sortable: true },
    { field: 'componentType', headerName: 'Component Type', filter: true, sortable: true },
    { field: 'componentSubType', headerName: 'Component Sub-Type', filter: true, sortable: true },
    { field: 'label', headerName: 'Label', filter: true, sortable: true },
    { 
      field: 'setting',
      headerName: 'Setting',
      filter: true,
      sortable: true,
      valueFormatter: (params) => JSON.stringify(params.value)
    },
    { 
      field: 'activeSetting',
      headerName: 'Active Setting',
      filter: true,
      sortable: true,
      valueFormatter: (params) => params.value ? JSON.stringify(params.value) : ''
    },
    { field: 'createdBy', headerName: 'Created By', filter: true, sortable: true },
    { field: 'updateBy', headerName: 'Updated By', filter: true, sortable: true },
    { field: 'createTime', headerName: 'Create Time', filter: true, sortable: true },
    { field: 'updateTime', headerName: 'Update Time', filter: true, sortable: true },
    { field: 'canOverride', headerName: 'Can Override', filter: true, sortable: true },
    { field: 'sourceNode', headerName: 'Source Node', filter: true, sortable: true },
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 150,
    resizable: true,
  }), []);

  const handleExportNodes = () => {
    if (nodesData.length === 0) return;
    
    const csvContent = [
      Object.keys(nodesData[0]).join(','),
      ...nodesData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nodes.csv';
    link.click();
  };

  const handleExportConfigurations = () => {
    if (configurationsData.length === 0) return;
    
    const csvContent = [
      Object.keys(configurationsData[0]).join(','),
      ...configurationsData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'object' ? `"${JSON.stringify(value)}"` : 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'configurations.csv';
    link.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center border-b px-4 py-2">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'nodes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('nodes')}
            className="text-sm"
          >
            Nodes Table
          </Button>
          <Button
            variant={activeTab === 'configurations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('configurations')}
            className="text-sm"
          >
            Configurations Table
          </Button>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={handleExportNodes} 
            variant="outline" 
            size="sm"
            disabled={activeTab !== 'nodes'}
          >
            Export Nodes
          </Button>
          <Button 
            onClick={handleExportConfigurations} 
            variant="outline" 
            size="sm"
            disabled={activeTab !== 'configurations'}
          >
            Export Configurations
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="h-full w-full ag-theme-alpine dark:ag-theme-alpine-dark">
          {activeTab === 'nodes' ? (
            <AgGridReact
              rowData={nodesData}
              columnDefs={nodeColumnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              suppressCellFocus={false}
              enableCellTextSelection={true}
            />
          ) : (
            <AgGridReact
              rowData={configurationsData}
              columnDefs={configColumnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              suppressCellFocus={false}
              enableCellTextSelection={true}
            />
          )}
        </div>
      </div>
    </div>
  );
} 