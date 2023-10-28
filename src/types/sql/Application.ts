export interface Application {
  id: string;
  name: string;
  tenant_id: string;
  allowed_web_origins: string;
  allowed_callback_urls: string;
  allowed_logout_urls: string;
  email_validation: "enabled" | "disabled" | "enforced";
  client_secret: string;
  created_at: string;
  updated_at: string;
}
