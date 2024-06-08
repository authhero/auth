import { z } from "zod";
import { baseEntitySchema } from "./BaseEntity";

const baseUserSchema = z.object({
  // One of the following is required
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
    is_social: z.boolean(),
    login_count: z.number(),
  });

export const auth0UserResponseSchema = userSchema
  .extend({
    user_id: z.string(),
    // TODO: Type identities
    identities: z.array(z.any()),
  })
  .omit({ id: true });

export type User = z.infer<typeof userSchema>;
