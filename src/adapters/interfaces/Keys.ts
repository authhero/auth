import { Certificate } from "../../types/SigningKey";

export interface KeysAdapter {
  create: (key: Certificate) => Promise<void>;
  list: () => Promise<Certificate[]>;
  revoke: (kid: string, revoke_at: Date) => Promise<boolean>;
}
