export interface TemplatesAdapter {
  get(tenant_id: string, id: string): Promise<string | undefined>;
}
