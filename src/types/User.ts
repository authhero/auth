import { z } from "zod";
import { baseEntitySchema } from "./BaseEntity";
import { identitySchema } from "./auth0/Identity";

export const baseUserSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  locale: z.string().optional(),
  linked_to: z.string().optional(),
  profileData: z.string().optional(),
});

export type BaseUser = z.infer<typeof baseUserSchema>;

export const userInsertSchema = baseUserSchema.extend({
  email_verified: z.boolean().default(false),
  verify_email: z.boolean().optional(),
  last_ip: z.string().optional(),
  last_login: z.string().optional(),
  user_id: z.string().optional(),
  provider: z.string().default("email"),
  connection: z.string().default("email"),
});

export const userSchema = userInsertSchema
  .extend(baseEntitySchema.shape)
  .extend({
    // TODO: this not might be correct if you use the username
    email: z.string(),
    is_social: z.boolean(),
    login_count: z.number(),
    identities: z.array(identitySchema).optional(),
  });

export type User = z.infer<typeof userSchema>;

export const auth0UserResponseSchema = userSchema
  .extend({
    user_id: z.string(),
  })
  .omit({ id: true });
