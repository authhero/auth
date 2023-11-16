export interface Code {
  id: string;
  tenant_id: string;
  email: string;
  code: string;
  type: "password_reset" | "validation";
  created_at: Date;
  expires_at: Date;
  used_at?: string;
  user_id?: string;
}
