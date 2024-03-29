export interface SqlSession {
  id: string;
  tenant_id: string;
  client_id: string;
  created_at: string;
  expires_at: string;
  deleted_at?: string;
  user_id: string;
  used_at: string;
}
