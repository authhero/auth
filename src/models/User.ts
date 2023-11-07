import { createProxy } from "trpc-durable-objects";
import { initTRPC } from "@trpc/server";
import { z, ZodSchema } from "zod";
import { Context } from "trpc-durable-objects";
import { nanoid } from "nanoid";
import { NoUserFoundError, NotFoundError, ConflictError } from "../errors";
import { Env, ProfileSchema } from "../types";
import { sendUserEvent, UserEvent } from "../services/events";
import { Profile } from "../types";

const UserSchema = z.object({
  email: z.string(),
  tenant_id: z.string(),
  id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
  locale: z.string().optional(),
  connections: z
    .array(
      z.object({
        name: z.string(),
        profile: z
          .record(z.union([z.string(), z.boolean(), z.number()]))
          .optional(),
      }),
    )
    .optional(),
});

const t = initTRPC.context<Context<Env>>().create();

const publicProcedure = t.procedure;

const router = t.router;

enum StorageKeys {
  profile = "profile",
  logs = "logs",
}

const PROFILE_FIELDS = [
  "name",
  "email",
  "given_name",
  "family_name",
  "nickname",
  "picture",
  "locale",
];

function parseStringToType<T>(schema: ZodSchema<T>, input?: string): T | null {
  if (!input) {
    return null;
  }

  return schema.parse(JSON.parse(input));
}

async function getProfile(storage: DurableObjectStorage) {
  const jsonData = await storage.get<string>(StorageKeys.profile);

  if (!jsonData) {
    return null;
  }

  const data = JSON.parse(jsonData);
  const patchedJsonData = JSON.stringify({
    ...data,
    // backwards compatible patch as we've since renamed the SQL columns to match Auth0
    updated_at: data.updated_at || data.modified_at,
  });

  return parseStringToType<Profile>(ProfileSchema, patchedJsonData);
}

// Stores information about the current operation and ensures that the user has an id.
async function updateProfile(
  ctx: Context<Env>,
  profile: Partial<Profile> & Pick<Profile, "tenant_id" | "email">,
) {
  let existingProfile = await getProfile(ctx.state.storage);

  if (!existingProfile || !existingProfile.id) {
    existingProfile = {
      id: nanoid(),
      updated_at: "",
      connections: [],
      created_at: new Date().toISOString(),
      ...profile,
    };
  }

  const updatedProfile: Profile = {
    ...existingProfile,
    ...profile,
    connections: existingProfile.connections,
    updated_at: new Date().toISOString(),
  };

  profile.connections?.forEach((connection) => {
    // remove any existing connections with the same name
    updatedProfile.connections = updatedProfile.connections?.filter(
      (c) => c.name !== connection.name,
    );

    updatedProfile.connections?.push(connection);

    // Set standard fields if not allready defined in profile
    PROFILE_FIELDS.forEach((key) => {
      if (!updatedProfile[key] && connection.profile?.[key]) {
        updatedProfile[key] = connection.profile[key];
      }
    });
  });

  await ctx.state.storage.put(
    StorageKeys.profile,
    JSON.stringify(updatedProfile),
  );

  await sendUserEvent(
    ctx.env,
    `${profile.tenant_id}|${profile.email}`,
    updatedProfile.id,
    existingProfile ? UserEvent.userUpdated : UserEvent.userCreated,
  );

  return updatedProfile;
}

export const userRouter = router({
  createUser: publicProcedure
    .input(UserSchema)
    .mutation(async ({ input, ctx }) => {
      let existingProfile = await getProfile(ctx.state.storage);

      if (existingProfile) {
        throw new ConflictError();
      }

      const profile = await updateProfile(ctx, input);

      return profile;
    }),
  delete: publicProcedure.mutation(async ({ ctx }) => {
    const profile = await getProfile(ctx.state.storage);

    if (!profile?.tenant_id) {
      throw new NotFoundError();
    }

    await ctx.state.storage.deleteAll();

    await sendUserEvent(
      ctx.env,
      `${profile.tenant_id}|${profile.email}`,
      profile.id,
      UserEvent.userDeleted,
    );
  }),
  getProfile: publicProcedure.query(async ({ ctx }) => {
    const profile = await getProfile(ctx.state.storage);
    if (!profile) {
      throw new NoUserFoundError();
    }

    return profile;
  }),
  loginWithConnection: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        connection: z.object({
          name: z.string(),
          profile: z
            .record(z.union([z.string(), z.boolean(), z.number()]))
            .optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await updateProfile(ctx, {
        email: input.email,
        tenant_id: input.tenantId,
        connections: [input.connection],
      });

      return profile;
    }),
  patchProfile: publicProcedure
    .input(UserSchema)
    .mutation(async ({ input, ctx }) => {
      const profile = await updateProfile(ctx, input);

      return profile;
    }),
});

type UserRouter = typeof userRouter;

export function getId(tenantId: string, email: string) {
  return `${tenantId}|${email.toLowerCase()}`;
}

export const User = createProxy<UserRouter, Env>(userRouter);

export type UserClient = ReturnType<typeof User.getInstance>;
