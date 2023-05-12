import { createProxy } from "trpc-durable-objects";
import bcrypt from "bcryptjs";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "trpc-durable-objects";

import generateOTP from "../utils/otp";
import {
  UnauthenticatedError,
  NoUserFoundError,
  UserConflictError,
  InvalidCodeError,
  AuthenticationCodeExpiredError,
} from "../errors";
import { AuthParams } from "../types/AuthParams";
import { v4 as uuidv4 } from "uuid";
import { Env } from "../types";
import { QueueMessage, sendUserEvent, UserEvent } from "../services/events";
import { User as Profile } from "../types/sql";

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
  "givenName",
  "familyName",
  "nickname",
  "picture",
  "locale",
];

// This might be different for different providers
const PROFILE_MAPPING = {
  name: "name",
  email: "email",
  given_name: "givenName",
  family_name: "familyName",
  nickname: "nickname",
  picture: "picture",
  locale: "locale",
};

async function getProfile(
  storage: DurableObjectStorage
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
  profile: Partial<Profile> & Pick<Profile, "tenantId" | "email">
) {
  let existingProfile = await getProfile(storage);

  if (!existingProfile || !existingProfile.id) {
    existingProfile = {
      id: uuidv4(),
      modifiedAt: "",
      connections: [],
      createdAt: new Date().toISOString(),
      ...profile,
    };
  }

  const updatedProfile: Profile = {
    ...existingProfile,
    modifiedAt: new Date().toISOString(),
  };

  profile.connections?.forEach((connection) => {
    // remove any existing connections with the same name
    updatedProfile.connections = updatedProfile.connections?.filter(
      (c) => c.name !== connection.name
    );

    updatedProfile.connections?.push(connection);

    // Set standard fields if allready defined in profile
    Object.keys(PROFILE_MAPPING)
      .filter((key) => !updatedProfile[PROFILE_MAPPING[key]])
      .forEach((key) => {
        updatedProfile[PROFILE_MAPPING[key]] = connection.profile?.[key];
      });
  });

  // Set standard fields if specified in profile
  PROFILE_FIELDS.filter((key) => profile[key]).forEach((key) => {
    updatedProfile[key] = profile[key];
  });

  await storage.put(StorageKeys.profile, JSON.stringify(updatedProfile));

  await sendUserEvent(
    queue,
    `${profile.tenantId}|${profile.email}`,
    existingProfile ? UserEvent.userUpdated : UserEvent.userCreated
  );

  return updatedProfile;
}

export const userRouter = router({
  createAuthenticationCode: publicProcedure
    .input(
      z.object({
        authParams: z.custom<AuthParams>(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result: Code = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
        authParams: input.authParams,
      };

      await ctx.state.storage.put(
        StorageKeys.authenticationCode,
        JSON.stringify(result)
      );

      return result;
    }),
  createEmailValidationCode: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const result: Code = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
      };

      await ctx.state.storage.put(
        StorageKeys.emailValidationCode,
        JSON.stringify(result)
      );

      return result;
    }),
  createPasswordResetCode: publicProcedure
    .input(z.string().nullish())
    .mutation(async ({ input, ctx }) => {
      const result: Code = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
      };

      await ctx.state.storage.put(
        StorageKeys.passwordResetCode,
        JSON.stringify(result)
      );

      return result;
    }),
  getProfile: publicProcedure.query(async ({ ctx }) =>
    getProfile(ctx.state.storage)
  ),
  isEmailValidated: publicProcedure.query(async ({ ctx }) => {
    return ctx.state.storage.get<boolean>(StorageKeys.emailValidated);
  }),
  registerPassword: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const passwordHash = await ctx.state.storage.get<string>(
        StorageKeys.passwordHash
      );

      if (passwordHash) {
        throw new UserConflictError();
      }

      await ctx.state.storage.put(
        StorageKeys.passwordHash,
        bcrypt.hashSync(input, 10)
      );
    }),
  setEmailValidated: publicProcedure
    .input(z.boolean())
    .query(async ({ input, ctx }) => {
      await ctx.state.storage.put(StorageKeys.emailValidated, input);
    }),
  patchProfile: publicProcedure
    .input(
      z.object({
        email: z.string(),
        tenantId: z.string(),
        id: z.string().optional(),
        createdAt: z.string().optional(),
        modifiedAt: z.string().optional(),
        givenName: z.string().optional(),
        familyName: z.string().optional(),
        nickname: z.string().optional(),
        name: z.string().optional(),
        picture: z.string().optional(),
        locale: z.string().optional(),
        connections: z
          .array(
            z.object({
              name: z.string(),
              profile: z.record(z.union([z.string(), z.boolean()])).optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await updateUser(
        ctx.state.storage,
        ctx.env.USERS_QUEUE,
        input
      );

      return profile;
    }),
  validateAuthenticationCode: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const codeString = await ctx.state.storage.get<string>(
        StorageKeys.authenticationCode
      );

      if (!codeString) {
        throw new UnauthenticatedError();
      }

      const code: Code = JSON.parse(codeString);

      if (input !== code.code) {
        throw new InvalidCodeError();
      }

      if (!code.expireAt || Date.now() > code.expireAt) {
        throw new AuthenticationCodeExpiredError();
      }

      // Remove once used
      await ctx.state.storage.put(StorageKeys.authenticationCode, "");

      return code.authParams;
    }),
  validateEmailValidationCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const code = await ctx.state.storage.get<Code>(
        StorageKeys.emailValidationCode
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
  validatePasswordResetCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const passwordResetCodeString = await ctx.state.storage.get<string>(
        StorageKeys.passwordResetCode
      );

      if (!passwordResetCodeString) {
        throw new Error();
      }

      const passwordResetCode: Code = JSON.parse(passwordResetCodeString);

      return (
        passwordResetCode &&
        input === passwordResetCode.code &&
        passwordResetCode.expireAt !== undefined &&
        Date.now() < passwordResetCode.expireAt
      );
    }),
  validatePassword: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const passwordHash = await ctx.state.storage.get<string>(
        StorageKeys.passwordHash
      );

      if (!passwordHash) {
        throw new NoUserFoundError();
      }

      if (!bcrypt.compareSync(input, passwordHash)) {
        throw new UnauthenticatedError();
      }
    }),
});

type UserRouter = typeof userRouter;

export function getId(tenantId: string, email: string) {
  return `${tenantId}|${email}`;
}

export const User = createProxy<UserRouter, Env>(userRouter);

export type UserClient = ReturnType<typeof User.getInstance>;
