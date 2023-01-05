export interface Jwks {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

export interface JwksKeys {
  keys: Jwks[];
}
