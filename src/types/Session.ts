export interface Session {
  id: string;
  tenant_id: string;
  client_id: string;
  created_at: Date;
  expires_at: Date;
  used_at?: Date;
  deleted_at?: Date;
  user_id: string;
}
