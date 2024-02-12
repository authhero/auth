import { User } from "../../src/types";

export const testUser: User = {
  id: "userId",
  email: "test@example.com",
  last_ip: "1.1.1.1",
  login_count: 0,
  last_login: new Date().toISOString(),
  is_social: false,
  provider: "email",
  connection: "email",
  email_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
