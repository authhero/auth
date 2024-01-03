export interface GetLogsResponseDetails {
  [key: string]: any;
}

export interface GetLogsResponseLocationInfo {
  country_code?: string;
  country_code3?: string;
  country_name?: string;
  city_name?: string;
  latitude?: string;
  longitude?: string;
  time_zone?: string;
  continent_code?: string;
}

export interface LogsResponse {
  date: string;
  type: string;
  description?: string;
  connection?: string;
  connection_id?: string;
  client_id: string;
  client_name: string;
  ip: string;
  hostname: string;
  user_id: string;
  user_name?: string;
  audience?: string;
  scope: string;
  strategy?: string;
  strategy_type?: string;
  log_id: string;
  isMobile?: boolean;
  details?: GetLogsResponseDetails;
  user_agent?: string;
  location_info?: GetLogsResponseLocationInfo;
  [key: string]: any;
}
