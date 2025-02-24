export interface ConfigNode {
  id: string;
  name: string;
  parentId: string | null;
  type: 'application' | 'region' | 'city' | 'department' | 'desk' | 'user';
  children?: ConfigNode[];
}

// Define the structure for configuration references
export interface ConfigurationReference {
  configRef: string;
  type: 'direct' | 'override';
  description?: string;
}

// Define valid setting types
export type SettingValue = 
  | string 
  | number 
  | boolean 
  | ConfigurationReference 
  | { [key: string]: SettingValue }
  | Array<SettingValue>;

export interface Configuration {
  id: string;
  parentId: string;
  componentType: string;
  componentSubType: string;
  label: string;
  setting: { [key: string]: SettingValue };
  activeSetting: Record<string, any>;
  createdBy: string;
  updateBy: string;
  createTime: string;
  updateTime: string;
  canOverride: boolean;
  sourceNode: string;
}