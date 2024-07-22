import { BaseUser, baseUserSchema } from "@authhero/adapter-interfaces";
import { z } from "zod";

export interface PostUsersBody extends BaseUser {
  password?: string;
  // Whether this user will receive a verification email after creation (true) or no email (false). Overrides behavior of email_verified parameter.
  verify_email?: boolean;
  username?: string;
  connection?: string;
  email_verified?: boolean;
}

export const userResponseSchema = baseUserSchema
  .extend({
    email: z.string(),
    login_count: z.number(),
    multifactor: z.array(z.string()).optional(),
    last_ip: z.string().optional(),
    last_login: z.string().optional(),
    user_id: z.string(),
  })
  .catchall(z.any());

export type UserResponse = z.infer<typeof userResponseSchema>;
