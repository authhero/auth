import { createProxy } from "trpc-durable-objects";
import bcrypt from "bcryptjs";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "trpc-durable-objects";
import { nanoid } from "nanoid";

import generateOTP from "../utils/otp";
import {
  UnauthenticatedError,
  NoUserFoundError,
  UserConflictError,
  InvalidCodeError,
  AuthenticationCodeExpiredError,
  NoCodeError,
} from "../errors";
import { AuthParams } from "../types/AuthParams";
import { Env } from "../types";
import { QueueMessage, sendUserEvent, UserEvent } from "../services/events";
import { Profile } from "../types";
import { migratePasswordHook } from "../hooks/migrate-password";

interface Code {
  authParams?: AuthParams;
  code: string;
  expireAt?: number;
  password?: string;
}

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;

const router = t.router;

enum StorageKeys {
  authenticationCode = "authentication-code",
  emailValidationCode = "email-validation-code",
  emailValidated = "email-validated",
  passwordResetCode = "password-reset-code",
  passwordHash = "password-hash",
  profile = "profile",
  socialConnections = "social-connections",
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

async function getProfile(
  storage: DurableObjectStorage,
): Promise<Profile | null> {
  const profilesString = await storage.get<string>(StorageKeys.profile);
  if (!profilesString) {
    return null;
  }

  return JSON.parse(profilesString);
}

// Stores information about the current operation and ensures that the user has an id.
async function updateUser(
  storage: DurableObjectStorage,
  queue: Queue<QueueMessage>,
  profile: Partial<Profile> & Pick<Profile, "tenantId" | "email">,
) {
  let existingProfile = await getProfile(storage);

  if (!existingProfile || !existingProfile.id) {
    existingProfile = {
      id: nanoid(),
      modified_at: "",
      connections: [],
      created_at: new Date().toISOString(),
      ...profile,
    };
  }

  const updatedProfile: Profile = {
    ...existingProfile,
    modified_at: new Date().toISOString(),
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

  await storage.put(StorageKeys.profile, JSON.stringify(updatedProfile));

  await sendUserEvent(
    queue,
    `${profile.tenantId}|${profile.email}`,
    existingProfile ? UserEvent.userUpdated : UserEvent.userCreated,
  );

  return updatedProfile;
}

export const userRouter = router({
  createAuthenticationCode: publicProcedure
    .input(
      z.object({
        authParams: z.custom<AuthParams>(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result: Code = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
        authParams: input.authParams,
      };

      await ctx.state.storage.put(
        StorageKeys.authenticationCode,
        JSON.stringify(result),
      );

      return result;
    }),
  createValidationCode: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const result: Code = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
      };

      await ctx.state.storage.put(
        StorageKeys.emailValidationCode,
        JSON.stringify(result),
      );

      return result;
    }),
  createPasswordResetCode: publicProcedure.mutation(async ({ ctx }) => {
    const result: Code = {
      code: generateOTP(),
      expireAt: Date.now() + 300 * 1000,
    };

    await ctx.state.storage.put(
      StorageKeys.passwordResetCode,
      JSON.stringify(result),
    );

    return result;
  }),
  getProfile: publicProcedure.query(async ({ ctx }) => {
    const profile = await getProfile(ctx.state.storage);
    if (!profile) {
      throw new NoUserFoundError();
    }

    return profile;
  }),
  isEmailValidated: publicProcedure.query(async ({ ctx }) => {
    return ctx.state.storage.get<boolean>(StorageKeys.emailValidated);
  }),
  registerPassword: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const passwordHash = await ctx.state.storage.get<string>(
        StorageKeys.passwordHash,
      );

      if (passwordHash) {
        throw new UserConflictError();
      }

      await ctx.state.storage.put(
        StorageKeys.passwordHash,
        bcrypt.hashSync(input, 10),
      );
    }),
  resetPasswordWithCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const passwordResetCodeString = await ctx.state.storage.get<string>(
        StorageKeys.passwordResetCode,
      );

      if (!passwordResetCodeString) {
        throw new InvalidCodeError("No code set");
      }

      const passwordResetCode: Code = JSON.parse(passwordResetCodeString);

      if (input.code !== passwordResetCode.code) {
        throw new InvalidCodeError();
      }

      if (
        !passwordResetCode.expireAt ||
        Date.now() > passwordResetCode.expireAt
      ) {
        throw new InvalidCodeError("Code expired");
      }

      await ctx.state.storage.put(
        StorageKeys.passwordHash,
        bcrypt.hashSync(input.password, 10),
      );

      ctx.state.storage.delete(StorageKeys.passwordResetCode);
    }),
  setEmailValidated: publicProcedure
    .input(z.boolean())
    .mutation(async ({ input, ctx }) => {
      await ctx.state.storage.put(StorageKeys.emailValidated, input);
    }),
  setPassword: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await ctx.state.storage.put(
        StorageKeys.passwordHash,
        bcrypt.hashSync(input, 10),
      );
    }),
  patchProfile: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        id: z.string().optional(),
        created_at: z.string().optional(),
        modified_at: z.string().optional(),
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await updateUser(
        ctx.state.storage,
        ctx.env.USERS_QUEUE,
        input,
      );

      return profile;
    }),
  validateAuthenticationCode: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const codeString = await ctx.state.storage.get<string>(
        StorageKeys.authenticationCode,
      );

      if (!codeString) {
        throw new NoCodeError();
      }

      const code: Code = JSON.parse(codeString);

      if (input.code !== code.code) {
        throw new InvalidCodeError();
      }

      if (!code.expireAt || Date.now() > code.expireAt) {
        throw new AuthenticationCodeExpiredError();
      }

      await updateUser(ctx.state.storage, ctx.env.USERS_QUEUE, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "email",
          },
        ],
      });

      // Remove once used
      await ctx.state.storage.put(StorageKeys.authenticationCode, "");

      return code.authParams;
    }),
  validateEmailValidationCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const code = await ctx.state.storage.get<Code>(
        StorageKeys.emailValidationCode,
      );

      if (!code) {
        throw new UnauthenticatedError();
      }

      if (input !== code.code) {
        throw new InvalidCodeError();
      }

      if (!code.expireAt || Date.now() > code.expireAt) {
        throw new AuthenticationCodeExpiredError();
      }

      // Set the email to validated
      await ctx.state.storage.put(StorageKeys.emailValidated, true);

      // Remove once used
      await ctx.state.storage.delete(StorageKeys.emailValidationCode);
    }),
  validatePassword: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const passwordHash = await ctx.state.storage.get<string>(
        StorageKeys.passwordHash,
      );

      if (!passwordHash) {
        if (
          await migratePasswordHook(
            ctx.env,
            input.tenantId,
            input.email,
            input.password,
          )
        ) {
          // Hash and store the password used
          await ctx.state.storage.put(
            StorageKeys.passwordHash,
            bcrypt.hashSync(input.password, 10),
          );
        } else {
          throw new NoUserFoundError();
        }
      } else if (!bcrypt.compareSync(input.password, passwordHash)) {
        throw new UnauthenticatedError();
      }

      return updateUser(ctx.state.storage, ctx.env.USERS_QUEUE, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "auth",
            profile: {
              email: input.email,
            },
          },
        ],
      });
    }),
});

type UserRouter = typeof userRouter;

export function getId(tenantId: string, email: string) {
  return `${tenantId}|${email}`;
}

export const User = createProxy<UserRouter, Env>(userRouter);

export type UserClient = ReturnType<typeof User.getInstance>;
