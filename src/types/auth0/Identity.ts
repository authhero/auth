const z = require("zod");

const profileDataSchema = z
  .object({
    email: z.string().optional(),
    email_verified: z.boolean().optional(),
    name: z.string().optional(),
    username: z.string().optional(),
    given_name: z.string().optional(),
    phone_number: z.string().optional(),
    phone_verified: z.boolean().optional(),
    family_name: z.string().optional(),
  })
  .catchall(z.any());

const identitySchema = z.object({
  connection: z.string(),
  user_id: z.string(),
  provider: z.string(),
  isSocial: z.boolean(),
  access_token: z.string().optional(),
  access_token_secret: z.string().optional(),
  refresh_token: z.string().optional(),
  profileData: profileDataSchema.optional(),
});

export type Identity = z.infer<typeof identitySchema>;
