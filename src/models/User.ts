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
} from "../errors";

interface Code {
  code?: string;
  codeExpireAt?: number;
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
    .input(z.string().nullish())
    .mutation(async ({ input, ctx }) => {
      const result = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
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
      const result = {
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
      const result = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
      };

      await ctx.state.storage.put(
        StorageKeys.passwordResetCode,
        JSON.stringify(result)
      );

      return result;
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
        profile: z.object({}),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProfiles =
        (await ctx.state.storage.get<Profiles>(StorageKeys.profile)) || {};
      existingProfiles.connection = input.profile;
      await ctx.state.storage.put(StorageKeys.profile, existingProfiles);
    }),
  validateAuthenticationCode: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const loginCode = await ctx.state.storage.get<Code>(
        StorageKeys.authenticationCode
      );

      if (!loginCode) {
        throw new UnauthenticatedError();
      }

      const ok =
        input === loginCode.code &&
        loginCode.codeExpireAt !== undefined &&
        Date.now() < loginCode.codeExpireAt;

      if (!ok) {
        throw new UnauthenticatedError();
      }

      // Remove once used
      await ctx.state.storage.delete(StorageKeys.authenticationCode);
    }),
  validateEmailValidationCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const emailValidationCode = await ctx.state.storage.get<Code>(
        StorageKeys.emailValidationCode
      );

      if (!emailValidationCode) {
        throw new UnauthenticatedError();
      }

      const ok =
        input === emailValidationCode.code &&
        emailValidationCode.codeExpireAt !== undefined &&
        Date.now() < emailValidationCode.codeExpireAt;

      if (!ok) {
        throw new UnauthenticatedError();
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
        passwordResetCode.codeExpireAt !== undefined &&
        Date.now() < passwordResetCode.codeExpireAt
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
