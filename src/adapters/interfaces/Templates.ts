export interface TemplatesAdapter {
  // create(
  //   tenant_id: string,
  //   params: { id: string; text: string },
  // ): Promise<string>;
  get(tenant_id: string, id: string): Promise<string | undefined>;
}
