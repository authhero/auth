import { createProxy } from "trpc-durable-objects";
import bcrypt from "bcryptjs";
import { initTRPC } from "@trpc/server";
import { z, ZodSchema } from "zod";
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
import { Env, ProfileSchema } from "../types";
import { QueueMessage, sendUserEvent, UserEvent } from "../services/events";
import { Profile } from "../types";
import { migratePasswordHook } from "../hooks/migrate-password";
import { LogMessage, LogMessageSchemaList } from "../types/LogMessage";

const CodeSchema = z.object({
  authParams: z.custom<AuthParams>().optional(),
  code: z.string(),
  expireAt: z.number().optional(),
  password: z.string().optional(),
});

const MAX_LOGS_LENGTH = 500;

type Code = z.infer<typeof CodeSchema>;

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;

const router = t.router;

enum StorageKeys {
  authenticationCode = "authentication-code",
  emailValidationCode = "email-validation-code",
  passwordResetCode = "password-reset-code",
  passwordHash = "password-hash",
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

  return parseStringToType<Profile>(ProfileSchema, jsonData);
}

async function getPasswordResetCode(storage: DurableObjectStorage) {
  const jsonData = await storage.get<string>(StorageKeys.passwordResetCode);

  return parseStringToType<Code>(CodeSchema, jsonData);
}

async function getAuthenticationCode(storage: DurableObjectStorage) {
  const jsonData = await storage.get<string>(StorageKeys.authenticationCode);

  return parseStringToType<Code>(CodeSchema, jsonData);
}

async function getEmailValidationCode(storage: DurableObjectStorage) {
  const jsonData = await storage.get<string>(StorageKeys.emailValidationCode);

  return parseStringToType<Code>(CodeSchema, jsonData);
}

async function getLogs(storage: DurableObjectStorage) {
  const jsonData = await storage.get<string>(StorageKeys.logs);
  if (!jsonData) {
    return [];
  }

  // return parseStringToType<LogMessage[]>(LogMessageSchemaList, jsonData) || [];
  return JSON.parse(jsonData) as LogMessage[];
}

async function writeLog(
  storage: DurableObjectStorage,
  message: Omit<LogMessage, "timestamp" | "id">,
) {
  // Make space for the new log row
  const logs = (await getLogs(storage)).slice(-MAX_LOGS_LENGTH + 1);

  logs.push({
    ...message,
    id: nanoid(),
    timestamp: new Date().toISOString(),
  });

  await storage.put(StorageKeys.logs, JSON.stringify(logs));
}

// Stores information about the current operation and ensures that the user has an id.
async function updateProfile(
  ctx: Context,
  profile: Partial<Profile> & Pick<Profile, "tenantId" | "email">,
) {
  let existingProfile = await getProfile(ctx.state.storage);

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
    ...profile,
    connections: existingProfile.connections,
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

  await ctx.state.storage.put(
    StorageKeys.profile,
    JSON.stringify(updatedProfile),
  );

  await sendUserEvent(
    ctx.env,
    `${profile.tenantId}|${profile.email}`,
    existingProfile ? UserEvent.userUpdated : UserEvent.userCreated,
  );

  return updatedProfile;
}

const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;

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
        expireAt: Date.now() + THIRTY_MINUTES_IN_MS,
        authParams: input.authParams,
      };

      await ctx.state.storage.put(
        StorageKeys.authenticationCode,
        JSON.stringify(result),
      );

      await writeLog(ctx.state.storage, {
        category: "login",
        message: "Create authentication code",
      });

      return result;
    }),
  createEmailValidationCode: publicProcedure.mutation(async ({ ctx }) => {
    const result: Code = {
      code: generateOTP(),
      expireAt: Date.now() + 300 * 1000,
    };

    await ctx.state.storage.put(
      StorageKeys.emailValidationCode,
      JSON.stringify(result),
    );

    await writeLog(ctx.state.storage, {
      category: "login",
      message: "Create email validation code",
    });

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

    await writeLog(ctx.state.storage, {
      category: "login",
      message: "Send password reset",
    });

    return result;
  }),
  getLogs: publicProcedure.query(async ({ ctx }) => getLogs(ctx.state.storage)),
  getProfile: publicProcedure.query(async ({ ctx }) => {
    const profile = await getProfile(ctx.state.storage);
    if (!profile) {
      throw new NoUserFoundError();
    }

    return profile;
  }),
  registerPassword: publicProcedure
    .input(
      z.object({
        tenantId: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const passwordHash = await getPasswordResetCode(ctx.state.storage);

      if (passwordHash) {
        throw new UserConflictError();
      }

      await ctx.state.storage.put(
        StorageKeys.passwordHash,
        bcrypt.hashSync(input.password, 10),
      );

      await writeLog(ctx.state.storage, {
        category: "login",
        message: "User created with password",
      });

      return updateProfile(ctx, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "auth",
            profile: {
              email: input.email,
              validated: false,
            },
          },
        ],
      });
    }),
  resetPasswordWithCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const passwordResetCode = await getPasswordResetCode(ctx.state.storage);

      if (!passwordResetCode) {
        throw new InvalidCodeError("No code set");
      }

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

      await writeLog(ctx.state.storage, {
        category: "update",
        message: "Reset password with code",
      });

      ctx.state.storage.delete(StorageKeys.passwordResetCode);
    }),
  setEmailValidated: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        validated: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await writeLog(ctx.state.storage, {
        category: "update",
        message: "Set email validated",
      });

      return updateProfile(ctx, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "auth",
            profile: {
              email: input.email,
              validated: input.validated,
            },
          },
        ],
      });
    }),
  setPassword: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      await writeLog(ctx.state.storage, {
        category: "update",
        message: "Set password",
      });

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
      const profile = await updateProfile(ctx, input);

      await writeLog(ctx.state.storage, {
        category: "update",
        message: "User profile",
      });

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
      const code = await getAuthenticationCode(ctx.state.storage);

      if (!code) {
        throw new NoCodeError();
      }

      if (input.code !== code.code) {
        throw new InvalidCodeError();
      }

      if (!code.expireAt || Date.now() > code.expireAt) {
        throw new AuthenticationCodeExpiredError();
      }

      const profile = await updateProfile(ctx, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "email",
            profile: {
              email: input.email,
              validated: true,
            },
          },
        ],
      });

      await writeLog(ctx.state.storage, {
        category: "login",
        message: "Login with code",
      });

      // Remove once used
      await ctx.state.storage.put(StorageKeys.authenticationCode, "");

      return profile;
    }),
  validateEmailValidationCode: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const emailValidation = await getEmailValidationCode(ctx.state.storage);

      if (!emailValidation) {
        throw new UnauthenticatedError();
      }

      if (input.code !== emailValidation.code) {
        throw new InvalidCodeError();
      }

      if (!emailValidation.expireAt || Date.now() > emailValidation.expireAt) {
        throw new AuthenticationCodeExpiredError();
      }

      await writeLog(ctx.state.storage, {
        category: "validation",
        message: "Validate with code",
      });

      // Remove once used
      await ctx.state.storage.delete(StorageKeys.emailValidationCode);

      // Set the email to validated
      return updateProfile(ctx, {
        email: input.email,
        tenantId: input.tenantId,
        connections: [
          {
            name: "auth",
            profile: {
              email: input.email,
              validated: true,
            },
          },
        ],
      });
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

      await writeLog(ctx.state.storage, {
        category: "login",
        message: "Login with password",
      });
    }),
});

type UserRouter = typeof userRouter;

export function getId(tenantId: string, email: string) {
  return `${tenantId}|${email}`;
}

export const User = createProxy<UserRouter, Env>(userRouter);

export type UserClient = ReturnType<typeof User.getInstance>;
