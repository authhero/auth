export interface Code {
  id: string;
  code: string;
  type: "password_reset" | "validation" | "verify-email";
  created_at: string;
  expires_at: string;
  used_at?: string;
  user_id: string;
}
