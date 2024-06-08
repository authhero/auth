import { z } from "zod";
import { baseEntitySchema } from "./BaseEntity";

const baseUserSchema = z.object({
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
  last_ip: z.string().optional(),
  last_login: z.string().optional(),
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
  });

export type User = z.infer<typeof userSchema>;

export const auth0UserResponseSchema = userSchema
  .extend({
    user_id: z.string(),
    // TODO: Type identities
    identities: z.array(z.any()),
  })
  .omit({ id: true });
