import { ConfigNode, Configuration, ConfigurationReference, SettingValue } from '@/types/config';

const DB_NAME = 'configServiceDB';
const DB_VERSION = 2;

// Sample data initialization function
async function initializeSampleData(database: Database) {
  // Sample nodes data with a hierarchical structure
  const sampleNodes: ConfigNode[] = [
    {
      id: 'app1',
      name: 'Main Application',
      type: 'application',
      parentId: null,
    },
    {
      id: 'reg1',
      name: 'North America',
      type: 'region',
      parentId: 'app1',
    },
    {
      id: 'city1',
      name: 'New York',
      type: 'city',
      parentId: 'reg1',
    },
    {
      id: 'dept1',
      name: 'Finance',
      type: 'department',
      parentId: 'city1',
    },
    {
      id: 'desk1',
      name: 'Trading Desk',
      type: 'desk',
      parentId: 'dept1',
    },
    {
      id: 'user1',
      name: 'John Trader',
      type: 'user',
      parentId: 'desk1',
    },
    {
      id: 'city2',
      name: 'San Francisco',
      type: 'city',
      parentId: 'reg1',
    },
    {
      id: 'dept2',
      name: 'Technology',
      type: 'department',
      parentId: 'city2',
    }
  ];

  // Generate 100 sample configurations
  const sampleConfigurations: Configuration[] = Array.from({ length: 100 }, (_, i) => {
    const id = `1d${i + 1}`;
    const nodeIds = ['app1', 'reg1', 'city1', 'city2', 'dept1', 'dept2', 'desk1', 'user1'];
    const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const nodeName = sampleNodes.find(node => node.id === randomNodeId)?.name || '';
    
    // Create some sample references for configurations after the first 10
    const setting: { [key: string]: SettingValue } = {
      color: ['red', 'blue', 'green'][Math.floor(Math.random() * 3)],
      size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)],
    };

    // Add references to earlier configurations for some settings
    if (i > 10 && Math.random() > 0.7) {
      const refId = `1d${Math.floor(Math.random() * 10) + 1}`;
      setting.reference = {
        configRef: refId,
        type: Math.random() > 0.5 ? 'direct' : 'override',
        description: `Reference to configuration ${refId}`
      };
    }
    
    return {
      id,
      parentId: randomNodeId,
      componentType: ['Button', 'Input', 'Table', 'Form', 'Chart'][Math.floor(Math.random() * 5)],
      componentSubType: ['Primary', 'Secondary', 'Tertiary'][Math.floor(Math.random() * 3)],
      label: `Configuration ${i + 1}`,
      setting,
      settings: [
        { id: 'setting1', value: 'value1' },
        { id: 'setting2', value: 'value2' },
      ],
      activeSetting: { id: 'setting1', value: 'value1' },
      createdBy: 'system',
      updateBy: 'system',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      canOverride: Math.random() > 0.5,
      sourceNode: nodeName,
    };
  });

  // Check if data already exists
  const existingNodes = await database.getAllNodes();
  if (existingNodes.length === 0) {
    // Add all nodes
    for (const node of sampleNodes) {
      await database.createNode(node);
    }

    // Add all configurations
    for (const config of sampleConfigurations) {
      await database.createConfiguration(config);
    }

    console.log('Sample data initialized successfully');
  }
}

// Add these utility functions after the initializeSampleData function

// Helper function to generate new ID
function generateNewId(prefix: string = '1d'): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to validate configuration reference
function isValidConfigurationReference(obj: any): obj is ConfigurationReference {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.configRef === 'string'
  );
}

// Helper function to find configuration references in an object
function findConfigurationReferences(obj: any): string[] {
  const references: string[] = [];
  
  function traverse(current: any) {
    if (!current || typeof current !== 'object') return;
    
    // Check if the current object is a valid reference
    if (isValidConfigurationReference(current)) {
      references.push(current.configRef);
      return;
    }
    
    // If it's an array, traverse each element
    if (Array.isArray(current)) {
      current.forEach(item => traverse(item));
      return;
    }
    
    // If it's an object, traverse each value
    Object.values(current).forEach(value => traverse(value));
  }
  
  traverse(obj);
  return Array.from(new Set(references)); // Remove duplicates
}

// Deep clone function for configurations
async function deepCloneConfiguration(
  configId: string,
  destinationNodeId: string,
  processedConfigs: Map<string, string> = new Map(),
  database: Database
): Promise<void> {
  // If we've already processed this configuration, skip it
  if (processedConfigs.has(configId)) {
    return;
  }

  // Get the original configuration
  const originalConfig = await database.getConfigurationById(configId);
  if (!originalConfig) {
    throw new Error(`Configuration ${configId} not found`);
  }

  // Find all configuration references in both setting and settings objects
  const settingRefs = findConfigurationReferences(originalConfig.setting);
  const settingsRefs = findConfigurationReferences(originalConfig.settings);
  const allRefs = [...new Set([...settingRefs, ...settingsRefs])];

  // Recursively clone referenced configurations first
  for (const refId of allRefs) {
    if (!processedConfigs.has(refId)) {
      await deepCloneConfiguration(refId, destinationNodeId, processedConfigs, database);
    }
  }

  // Generate new ID for current configuration
  const newId = generateNewId();
  processedConfigs.set(configId, newId);

  // Create deep copy of the configuration
  const newConfig: Configuration = {
    ...originalConfig,
    id: newId,
    parentId: destinationNodeId,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  };

  // Update references in both setting and settings objects
  function updateReferences(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(updateReferences);
    }

    if (isValidConfigurationReference(obj) && processedConfigs.has(obj.configRef)) {
      return {
        ...obj,
        configRef: processedConfigs.get(obj.configRef)
      };
    }

    const newObj: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = updateReferences(value);
    }
    return newObj;
  }

  newConfig.setting = updateReferences(newConfig.setting);
  newConfig.settings = updateReferences(newConfig.settings);

  // Save the new configuration
  await database.createConfiguration(newConfig);
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = async () => {
        this.db = request.result;
        // Initialize sample data after database is created
        await initializeSampleData(this);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Delete existing stores if they exist
        if (db.objectStoreNames.contains('nodes')) {
          db.deleteObjectStore('nodes');
        }
        if (db.objectStoreNames.contains('configurations')) {
          db.deleteObjectStore('configurations');
        }

        // Create nodes store
        const nodesStore = db.createObjectStore('nodes', { keyPath: 'id' });
        nodesStore.createIndex('parentId', 'parentId', { unique: false });

        // Create configurations store
        const configsStore = db.createObjectStore('configurations', { keyPath: 'id' });
        configsStore.createIndex('parentId', 'parentId', { unique: false });
      };
    });
  }

  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    return this.transaction<T[]>(storeName, 'readonly', (store) => store.getAll());
  }

  private async addToStore<T>(storeName: string, item: T): Promise<void> {
    await this.transaction(storeName, 'readwrite', (store) => store.add(item));
  }

  private async putToStore<T>(storeName: string, item: T): Promise<void> {
    await this.transaction(storeName, 'readwrite', (store) => store.put(item));
  }

  private async deleteFromStore(storeName: string, key: string): Promise<void> {
    await this.transaction(storeName, 'readwrite', (store) => store.delete(key));
  }

  // Node operations
  async getAllNodes(): Promise<ConfigNode[]> {
    const nodes = await this.getAllFromStore<ConfigNode>('nodes');
    return buildNodeTree(nodes);
  }

  async createNode(node: ConfigNode): Promise<ConfigNode> {
    await this.addToStore('nodes', node);
    return node;
  }

  async updateNode(node: ConfigNode): Promise<ConfigNode> {
    await this.putToStore('nodes', node);
    return node;
  }

  async deleteNode(id: string): Promise<void> {
    await this.deleteFromStore('nodes', id);
  }

  async getNodeById(id: string): Promise<ConfigNode | null> {
    return this.transaction<ConfigNode | undefined>('nodes', 'readonly', (store) => store.get(id))
      .then(result => result || null);
  }

  // Configuration operations
  async getAllConfigurations(): Promise<Configuration[]> {
    return this.getAllFromStore<Configuration>('configurations');
  }

  async getConfigurationsByParentId(parentId: string): Promise<Configuration[]> {
    const allConfigs = await this.getAllConfigurations();
    return allConfigs.filter(config => config.parentId === parentId);
  }

  async createConfiguration(config: Configuration): Promise<Configuration> {
    await this.addToStore('configurations', config);
    return config;
  }

  async updateConfiguration(config: Configuration): Promise<Configuration> {
    await this.putToStore('configurations', config);
    return config;
  }

  async deleteConfiguration(id: string): Promise<void> {
    await this.deleteFromStore('configurations', id);
  }

  async deleteConfigurationsByParentId(parentId: string): Promise<void> {
    const configs = await this.getConfigurationsByParentId(parentId);
    const transaction = this.db!.transaction('configurations', 'readwrite');
    const store = transaction.objectStore('configurations');
    
    return new Promise((resolve, reject) => {
      configs.forEach(config => store.delete(config.id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getConfigurationById(id: string): Promise<Configuration | null> {
    return this.transaction<Configuration | undefined>('configurations', 'readonly', (store) => store.get(id))
      .then(result => result || null);
  }

  async cloneConfigurationWithReferences(configId: string, destinationNodeId: string): Promise<void> {
    const processedConfigs = new Map<string, string>();
    await deepCloneConfiguration(configId, destinationNodeId, processedConfigs, this);
    return;
  }
}

// Helper function to build node tree
function buildNodeTree(nodes: ConfigNode[]): ConfigNode[] {
  const nodeMap = new Map<string, ConfigNode>();
  const rootNodes: ConfigNode[] = [];

  // First pass: create nodes with empty children arrays
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Second pass: build the tree structure
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id)!;
    if (node.parentId === null) {
      rootNodes.push(currentNode);
    } else {
      const parentNode = nodeMap.get(node.parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(currentNode);
      }
    }
  });

  return rootNodes;
}

// Example function to create a configuration with multiple references
async function createConfigurationWithMultipleRefs(
  parentId: string,
  referencedConfigIds: string[]
): Promise<Configuration> {
  const newConfig: Configuration = {
    id: generateNewId(),
    parentId,
    componentType: "MultiRefComponent",
    componentSubType: "ArrayExample",
    label: "Configuration with Multiple References",
    setting: {
      // Example of single reference
      primaryConfig: {
        configRef: referencedConfigIds[0],
        type: "direct",
        description: "Primary configuration reference"
      },
      // Example of array of references
      relatedConfigs: referencedConfigIds.map(refId => ({
        configRef: refId,
        type: "override",
        description: `Reference to configuration ${refId}`
      })),
      // Example of mixed settings with references
      complexSetting: {
        name: "Example Setting",
        value: 42,
        references: referencedConfigIds.map(refId => ({
          configRef: refId,
          type: "direct",
          description: `Nested reference to ${refId}`
        }))
      }
    },
    settings: [
      { id: 'setting1', value: 'value1' },
      { id: 'setting2', value: 'value2' }
    ],
    activeSetting: { id: 'setting1', value: 'value1' },
    createdBy: 'system',
    updateBy: 'system',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    canOverride: true,
    sourceNode: 'Example Node'
  };

  return database.createConfiguration(newConfig);
}

// Create and initialize database instance
const database = new Database();
await database.init();

// Export operations with async/await handling
export const nodeOperations = {
  getAll: () => database.getAllNodes(),
  create: (node: ConfigNode) => database.createNode(node),
  update: (node: ConfigNode) => database.updateNode(node),
  delete: (id: string) => database.deleteNode(id),
  getById: (id: string) => database.getNodeById(id)
};

export const configOperations = {
  getAll: () => database.getAllConfigurations(),
  getByParentId: (parentId: string) => database.getConfigurationsByParentId(parentId),
  create: (config: Configuration) => database.createConfiguration(config),
  update: (config: Configuration) => database.updateConfiguration(config),
  delete: (id: string) => database.deleteConfiguration(id),
  deleteByParentId: (parentId: string) => database.deleteConfigurationsByParentId(parentId),
  cloneConfigurationWithReferences: (configId: string, destinationNodeId: string) => 
    database.cloneConfigurationWithReferences(configId, destinationNodeId),
  createWithMultipleRefs: (parentId: string, referencedConfigIds: string[]) =>
    createConfigurationWithMultipleRefs(parentId, referencedConfigIds)
};

export { database }; 