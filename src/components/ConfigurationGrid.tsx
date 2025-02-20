import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  AllCommunityModule,
  ICellRendererParams,
  GridReadyEvent,
  SelectionChangedEvent,
  IsRowSelectable,
  ColDef,
  ValueFormatterParams,
  IRowNode,
  GridSizeChangedEvent,
  ModuleRegistry,
  themeQuartz
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { Configuration, ConfigNode } from '@/types/config';
import { ConfigurationDialog } from './ConfigurationDialog';
import { Button } from '@/components/ui/button';
import { FileEdit } from 'lucide-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register all required modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule
]);

// Create theme instance
const gridTheme = themeQuartz;

interface ConfigurationGridProps {
  configurations: Configuration[];
  onSelectionChanged: (selectedRows: Configuration[] | Configuration) => void;
  selectedNode?: ConfigNode;
  nodes: ConfigNode[];
}

export function ConfigurationGrid({ 
  configurations, 
  onSelectionChanged,
  selectedNode
}: ConfigurationGridProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState<Configuration | undefined>(undefined);
  const gridRef = useRef<AgGridReact>(null);

  // Theme observer
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      // Update AG Grid theme mode
      document.body.dataset.agThemeMode = currentTheme === 'dark' ? 'dark' : 'light';
    };

    // Initial theme
    updateTheme();

    // Create observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

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

  const ActionCellRenderer = (props: ICellRendererParams<Configuration>) => {
    const isInherited = props.data?.parentId !== selectedNode?.id;
    return (
      <div className="flex items-center h-full">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent hover:bg-transparent dark:hover:bg-transparent transition-opacity hover:opacity-70 dark:text-gray-300"
          onClick={() => props.data && handleEdit(props.data)}
          disabled={isInherited}
          title={isInherited ? "Cannot edit inherited configurations" : "Edit configuration"}
        >
          <FileEdit className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const ConfigSourceCellRenderer = (props: ICellRendererParams<Configuration>) => {
    if (props.data?.parentId === selectedNode?.id) {
      return <span className="text-gray-700 font-medium">Direct</span>;
    }
    return <span className="text-blue-600 font-medium">Inherited</span>;
  };

  const columnDefs = useMemo<ColDef<Configuration>[]>(() => [
    { 
      headerName: '',
      minWidth: 60,
      checkboxSelection: true,
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
      valueFormatter: (params: ValueFormatterParams<Configuration>) => {
        return params.data?.parentId === selectedNode?.id ? '-' : params.value;
      },
    },
    { field: 'componentType', headerName: 'Component Type', minWidth: 150 },
    { field: 'componentSubType', headerName: 'Component Sub-Type', minWidth: 150 },
    { field: 'label', headerName: 'Label', minWidth: 150 },
    { 
      field: 'setting', 
      headerName: 'Setting',
      minWidth: 150,
      valueFormatter: (params: ValueFormatterParams<Configuration>) => params.value ? JSON.stringify(params.value) : '',
      autoHeight: true,
    },
    { 
      field: 'settings', 
      headerName: 'Settings',
      minWidth: 150,
      valueFormatter: (params: ValueFormatterParams<Configuration>) => params.value ? JSON.stringify(params.value) : '',
      autoHeight: true,
    },
    { 
      field: 'activeSetting', 
      headerName: 'Active Setting',
      minWidth: 200,
      valueFormatter: (params: ValueFormatterParams<Configuration>) => params.value ? JSON.stringify(params.value) : '',
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

  const onSelectionChangedHandler = (event: SelectionChangedEvent<Configuration>) => {
    const selectedRows = event.api.getSelectedRows();
    onSelectionChanged(selectedRows);
  };

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  const isRowSelectable: IsRowSelectable<Configuration> = (node: IRowNode<Configuration>) => {
    return node.data?.parentId === selectedNode?.id;
  };

  return (
    <>
      <div className="w-full h-full" style={{ height: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={configurations}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onSelectionChanged={onSelectionChangedHandler}
          onGridReady={onGridReady}
          isRowSelectable={isRowSelectable}
          rowHeight={48}
          headerHeight={48}
          className="font-sans"
          onGridSizeChanged={(params: GridSizeChangedEvent) => {
            params.api.sizeColumnsToFit();
          }}
          rowModelType="clientSide"
          enableCellTextSelection={true}
          ensureDomOrder={true}
          suppressCellFocus={false}
          popupParent={document.body}
          theme={gridTheme}
        />
      </div>

      <ConfigurationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        currentNode={selectedNode!}
        configuration={selectedConfiguration}
      />
    </>
  );
}