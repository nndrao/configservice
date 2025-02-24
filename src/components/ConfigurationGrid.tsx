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
  themeQuartz,
  CellValueChangedEvent
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { Configuration, ConfigNode } from '@/types/config';
import { ConfigurationDialog } from './ConfigurationDialog';
import { Button } from '@/components/ui/button';
import { FileEdit, Save } from 'lucide-react';


// Register all required modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule
]);

// Create theme instance
const gridTheme = themeQuartz
  .withParams(
    {
      backgroundColor: "#FFE8E0",
      foregroundColor: "#361008CC",
      browserColorScheme: "light",
    },
    "light-red",
  )
  .withParams(
    {
      backgroundColor: "#201008",
      foregroundColor: "#FFFFFFCC",
      browserColorScheme: "dark",
    },
    "dark-red",
  );

interface ConfigurationGridProps {
  configurations: Configuration[];
  onSelectionChanged: (selectedRows: Configuration[] | Configuration) => void;
  selectedNode?: ConfigNode;
  onSaveChanges?: (configurations: Configuration[]) => Promise<void>;
}

export function ConfigurationGrid({ 
  configurations, 
  onSelectionChanged,
  selectedNode,
  onSaveChanges
}: ConfigurationGridProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState<Configuration | undefined>(undefined);
  const [modifiedConfigs, setModifiedConfigs] = useState<Map<string, Configuration>>(new Map());
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
    setModifiedConfigs(prev => new Map(prev).set(updatedConfiguration.id, updatedConfiguration));
    // Update the configuration in the parent component
    const updatedConfigurations = configurations.map(config => 
      config.id === updatedConfiguration.id ? updatedConfiguration : config
    );
    onSelectionChanged(updatedConfigurations);
    setEditDialogOpen(false);
  };

  const handleCellValueChanged = (event: CellValueChangedEvent) => {
    if (event.data && event.newValue !== event.oldValue) {
      const updatedConfig = {
        ...event.data,
        [event.column.getColId()]: event.newValue,
        updateTime: new Date().toISOString()
      };
      
      // Store the entire updated configuration
      setModifiedConfigs(prev => new Map(prev).set(updatedConfig.id, updatedConfig));
      
      // Update the grid view
      event.api.applyTransaction({ update: [updatedConfig] });
    }
  };

  const handleSaveToDatabase = async () => {
    if (modifiedConfigs.size === 0) return;

    try {
      if (onSaveChanges) {
        // Convert Map values to array
        const modifiedConfigurationsArray = Array.from(modifiedConfigs.values());
        await onSaveChanges(modifiedConfigurationsArray);
        setModifiedConfigs(new Map()); // Clear modified configs after successful save
      }
    } catch (error) {
      console.error('Error saving configurations:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const ActionCellRenderer = (props: ICellRendererParams<Configuration>) => {
    const isInherited = props.data?.parentId !== selectedNode?.id;
    return (
      <div className="flex items-center justify-center" style={{ margin: '5px' }}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent hover:bg-transparent"
          onClick={() => props.data && handleEdit(props.data)}
          disabled={isInherited}
          title={isInherited ? "Cannot edit inherited configurations" : "Edit configuration"}
        >
          <FileEdit className="h-4 w-4" style={{ color: 'inherit' }} />
        </Button>
      </div>
    );
  };

  const ConfigSourceCellRenderer = (props: ICellRendererParams<Configuration>) => {
    if (props.data?.parentId === selectedNode?.id) {
      return <span style={{ color: 'inherit' }}>Direct</span>;
    }
    return <span className="text-blue-600">Inherited</span>;
  };

  const columnDefs = useMemo<ColDef<Configuration>[]>(() => [
    { 
      headerName: '',
      minWidth: 80,
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
      headerName: '',
      minWidth:80,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      filter: false,
      resizable: false,
      align: 'center',
      suppressHeaderMenuButton:true
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
    { 
      field: 'componentType', 
      headerName: 'Component Type', 
      minWidth: 150,
      editable: true
    },
    { 
      field: 'componentSubType', 
      headerName: 'Component Sub-Type', 
      minWidth: 150,
      editable: true
    },
    { 
      field: 'label', 
      headerName: 'Label', 
      minWidth: 150,
      editable: true
    },
    {
      field: 'setting', 
      headerName: 'Setting',
      minWidth: 150,
      editable: true,
      valueFormatter: (params: ValueFormatterParams<Configuration>) => params.value ? JSON.stringify(params.value) : '',
      valueSetter: (params) => {
        try {
          const newValue = JSON.parse(params.newValue);
          params.data.setting = newValue;
          return true;
        } catch (e) {
          console.error('Invalid JSON:', e);
          return false;
        }
      }
    },
    {
      field: 'activeSetting', 
      headerName: 'Active Setting',
      minWidth: 200,
      editable: true,
      valueFormatter: (params: ValueFormatterParams<Configuration>) => params.value ? JSON.stringify(params.value) : '',
      valueSetter: (params) => {
        try {
          const newValue = JSON.parse(params.newValue);
          params.data.activeSetting = newValue;
          return true;
        } catch (e) {
          console.error('Invalid JSON:', e);
          return false;
        }
      }
    },
    { field: 'createdBy', headerName: 'Created By', minWidth: 120, editable: true },
    { field: 'updateBy', headerName: 'Updated By', minWidth: 120, editable: true },
    { field: 'createTime', headerName: 'Create Time', minWidth: 150 },
    { field: 'updateTime', headerName: 'Update Time', minWidth: 150 },
    { field: 'canOverride', headerName: 'Can Override', minWidth: 120, editable: true },
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
      <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            onClick={handleSaveToDatabase}
            disabled={modifiedConfigs.size === 0}
            className="action-button"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes ({modifiedConfigs.size})
          </Button>
        </div>
        <div className="flex-1">
          <AgGridReact
            ref={gridRef}
            rowData={configurations}
            columnDefs={columnDefs}
            defaultColDef={{
              ...defaultColDef,
              editable: false,
              cellStyle: (params) => {
                // Highlight modified cells
                if (params.data && modifiedConfigs.has(params.data.id)) {
                  return { backgroundColor: 'rgba(var(--primary), 0.1)' };
                }
                return null;
              }
            }}
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
            onCellValueChanged={handleCellValueChanged}
            rowModelType="clientSide"
            enableCellTextSelection={true}
            ensureDomOrder={true}
            suppressCellFocus={false}
            popupParent={document.body}
            theme={gridTheme}
          />
        </div>
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