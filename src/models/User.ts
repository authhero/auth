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

interface Code {
  authParams?: AuthParams;
  code: string;
  expireAt?: number;
  password?: string;
}

interface Profiles {
  [key: string]: any;
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

interface SocialConnection {
  type: string;
  userId: string;
  profile: any;
}

export const userRouter = router({
  connectWithSocial: publicProcedure
    .input(z.string().describe("connection name"))
    .mutation(async ({ input, ctx }) => {
      const socialConnections = await ctx.state.storage.get<SocialConnection[]>(
        StorageKeys.socialConnections
      );

      const connection = socialConnections?.find((sc) => sc.type === input);

      throw new Error("Not implemented");
    }),
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
  getProfile: publicProcedure.query(async ({ ctx }) => {
    const profilesString = await ctx.state.storage.get<string>(
      StorageKeys.profile
    );
    return profilesString ? JSON.parse(profilesString) : {};
  }),
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
        connection: z.string(),
        profile: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProfileString = await ctx.state.storage.get<string>(
        StorageKeys.profile
      );
      const existingProfile = existingProfileString
        ? JSON.parse(existingProfileString)
        : { connection: {} };

      // Set standard fields if not defined
      ["name", "given_name", "family_name", "nickname", "picture", "locale"]
        .filter((key) => !existingProfile[key])
        .forEach((key) => {
          existingProfile[key] = input.profile[key];
        });

      existingProfile.connection[input.connection] = input.profile;
      await ctx.state.storage.put(
        StorageKeys.profile,
        JSON.stringify(existingProfile)
      );
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

export function getId(clientId: string, email: string) {
  return `${clientId}|auth|${email}`;
}

export const User = createProxy<UserRouter>(userRouter);
