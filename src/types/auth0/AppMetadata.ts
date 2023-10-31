export interface AppMetadata {
  id: string;
  type: string;
  title: string;
  description: string;
  defaultValue: {
    plan: string;
  };
  [key: string]: any;
}
