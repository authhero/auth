export interface LogMessage {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  tenant_id: string;
  client_id: string;
}
