export interface ConfigNode {
  id: string;
  name: string;
  parentId: string | null;
  type: 'application' | 'region' | 'city' | 'department' | 'desk' | 'user';
  children?: ConfigNode[];
}

export interface Configuration {
  id: string;
  parentId: string;
  componentType: string;
  componentSubType: string;
  label: string;
  setting: Record<string, any>;
  settings: Record<string, any>;
  activeSetting: Record<string, any>;
  createdBy: string;
  updateBy: string;
  createTime: string;
  updateTime: string;
  canOverride: boolean;
  sourceNode: string;
}