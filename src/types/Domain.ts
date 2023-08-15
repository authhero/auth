export interface Domain {
  hostname: string;
  id: string;
  ssl: {
    bundle_method: string;
    certificate_authority: string;
    custom_certificate: string;
    custom_csr_id: string;
    custom_key: string;
    expires_on: string;
    hosts: string[];
    id: string;
    issuer: string;
    method: string;
    serial_number: string;
    settings: {
      ciphers: string[];
      early_hints: string;
      http2: string;
      min_tls_version: string;
      tls_1_3: string;
    };
    signature: string;
    status: string;
    type: string;
    uploaded_on: string;
    validation_errors: {
      message: string;
    }[];
    validation_records: {
      emails: string[];
      http_body: string;
      http_url: string;
      txt_name: string;
      txt_value: string;
    }[];
    wildcard: boolean;
  };
  created_at: string;
  custom_metadata: {
    [key: string]: string;
  };
  custom_origin_server: string;
  custom_origin_sni: string;
  ownership_verification: {
    name: string;
    type: string;
    value: string;
  };
  ownership_verification_http: {
    http_body: string;
    http_url: string;
  };
  status: string;
  verification_errors: string[];
}
