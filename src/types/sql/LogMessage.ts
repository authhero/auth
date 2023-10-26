export interface LogMessage {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  tenant_id: string;
  user_id: string;
}
