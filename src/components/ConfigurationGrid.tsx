import React, { useState, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Configuration, ConfigNode } from '@/types/config';
import { ConfigurationDialog } from './ConfigurationDialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface ConfigurationGridProps {
  configurations: Configuration[];
  onSelectionChanged: (selectedRows: Configuration[] | Configuration) => void;
  selectedNode?: ConfigNode;
  nodes: ConfigNode[];
}

export function ConfigurationGrid({ 
  configurations, 
  onSelectionChanged,
  selectedNode,
  nodes
}: ConfigurationGridProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState<Configuration | null>(null);
  const gridRef = useRef<any>(null);

  const handleEdit = (configuration: Configuration) => {
    if (configuration.parentId === selectedNode?.id) {
      setSelectedConfiguration(configuration);
      setEditDialogOpen(true);
    }
  };

  const handleSave = (updatedConfiguration: Configuration) => {
    // Update the configuration in the parent component
    const updatedConfigurations = configurations.map(config => 
      config.id === updatedConfiguration.id ? updatedConfiguration : config
    );
    onSelectionChanged(updatedConfigurations);
    setEditDialogOpen(false);
  };

  const ActionCellRenderer = (props: any) => {
    const isInherited = props.data.parentId !== selectedNode?.id;
    return (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
          onClick={() => handleEdit(props.data)}
          disabled={isInherited}
          title={isInherited ? "Cannot edit inherited configurations" : "Edit configuration"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const ConfigSourceCellRenderer = (props: any) => {
    if (props.data.parentId === selectedNode?.id) {
      return <span className="text-gray-700 font-medium">Direct</span>;
    }
    return <span className="text-blue-600 font-medium">Inherited</span>;
  };

  const columnDefs = useMemo(() => [
    { 
      headerName: '',
      width: 50,
      maxWidth: 50,
      checkboxSelection: (params: any) => params.data.parentId === selectedNode?.id,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      suppressMenu: true,
     
      resizable: false,
    },
    {
      field: 'id',
      headerName: 'ID',
      minWidth: 100,
    },
    {
      field: 'parentId',
      headerName: 'Parent ID',
      minWidth: 100,
    },
    {
      headerName: 'Actions',
      width: 100,
      maxWidth: 100,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      headerName: 'Config Source',
      minWidth: 130,
      cellRenderer: ConfigSourceCellRenderer,
      sortable: false,
      filter: false,
    },
    {
      field: 'sourceNode',
      headerName: 'Source Node',
      minWidth: 130,
      valueFormatter: (params: any) => {
        return params.data.parentId === selectedNode?.id ? '-' : params.value;
      },
    },
    { field: 'componentType', headerName: 'Component Type', minWidth: 150 },
    { field: 'componentSubType', headerName: 'Component Sub-Type', minWidth: 150 },
    { field: 'label', headerName: 'Label', minWidth: 150 },
    { 
      field: 'setting', 
      headerName: 'Setting',
      minWidth: 150,
      valueFormatter: (params: any) => params.value ? JSON.stringify(params.value) : '',
      autoHeight: true,
    },
    { 
      field: 'settings', 
      headerName: 'Settings',
      minWidth: 150,
      valueFormatter: (params: any) => params.value ? JSON.stringify(params.value) : '',
      autoHeight: true,
    },
    { 
      field: 'activeSetting', 
      headerName: 'Active Setting',
      minWidth: 200,
      valueFormatter: (params: any) => params.value ? JSON.stringify(params.value) : '',
      autoHeight: true,
    },
    { field: 'createdBy', headerName: 'Created By', minWidth: 120 },
    { field: 'updateBy', headerName: 'Updated By', minWidth: 120 },
    { field: 'createTime', headerName: 'Create Time', minWidth: 150 },
    { field: 'updateTime', headerName: 'Update Time', minWidth: 150 },
    { field: 'canOverride', headerName: 'Can Override', minWidth: 120 },
  ], [selectedNode]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
  }), []);

  const onSelectionChangedHandler = (event: any) => {
    const selectedRows = event.api.getSelectedRows();
    onSelectionChanged(selectedRows);
  };

  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
    // Auto-size all columns after data is loaded
    params.columnApi.autoSizeAllColumns();
  };

  return (
    <>
      <div className="ag-theme-alpine w-full h-full">
        <AgGridReact
          ref={gridRef}
          rowData={configurations}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onSelectionChanged={onSelectionChangedHandler}
          onGridReady={onGridReady}
          isRowSelectable={(params: any) => params.data.parentId === selectedNode?.id}
          rowHeight={48}
          headerHeight={48}
          className="font-sans"
          rowClass="hover:bg-gray-50"
          onGridSizeChanged={(params) => {
            params.api.sizeColumnsToFit();
          }}
        />
      </div>

      <ConfigurationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        nodes={nodes}
        currentNode={selectedNode!}
        configuration={selectedConfiguration}
      />
    </>
  );
}