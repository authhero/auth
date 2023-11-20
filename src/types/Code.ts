export interface Code {
  id: string;
  code: string;
  email: string;
  type: "password_reset" | "validation";
  created_at: string;
  expires_at: string;
  used_at?: string;
  user_id?: string;
}
