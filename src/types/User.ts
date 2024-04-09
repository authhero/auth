import { z } from "zod";
import { baseEntitySchema } from "./BaseEntity";

export const baseUserSchema = z.object({
  // One of the following is required
  email: z.string().optional(),
  username: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
  linked_to: z.string().optional(),
  profileData: z.string().optional(),
});

export const userInsertSchema = baseUserSchema.extend({
  email_verified: z.boolean().default(false),
  last_ip: z.string().optional(),
  last_login: z.string().optional(),
  provider: z.string().optional(),
  connection: z.string(),
});

export const userSchema = userInsertSchema
  .extend(baseEntitySchema.shape)
  .extend({
    is_social: z.boolean(),
    login_count: z.number(),
  });

export interface BaseUser {
  // TODO - Auth0 requires the id OR the email but for our current usage with durable objects and Sesamy's architecture, we need email!
  email: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  linked_to?: string;
  profileData?: string;
}

export interface User extends BaseUser {
  id: string;
  email_verified: boolean;
  last_ip?: string;
  last_login?: string;
  login_count: number;
  provider: string;
  connection: string;
  is_social: boolean;
  created_at: string;
  updated_at: string;
}
