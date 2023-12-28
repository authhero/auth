export interface Certificate {
  private_key: string;
  public_key: string;
  kid: string;
  created_at: string;
  revoked_at?: string;
}

export interface SigningKey {
  // The key id of the signing key
  kid: string;
  // The public certificate of the signing key
  cert: string;
  // The cert fingerprint
  fingerprint: string;
  // The cert thumbprint
  thumbprint: string;

  // The public certificate of the signing key in pkcs7 format
  pkcs7?: string;
  // True if the key is the current key
  current?: boolean;
  // True if the key is the next key
  next?: boolean;
  // True if the key is the previous key
  previous?: boolean;
  // The date and time when the key became the current key
  current_since?: string;
  // The date and time when the current key was rotated
  current_until?: string;
  // True if the key is revoked
  revoked?: boolean;
  // The date and time when the key was revoked
  revoked_at?: string;
}
