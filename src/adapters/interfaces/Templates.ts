export interface TemplatesAdapter {
  get(id: string): Promise<string | null>;
}
