import { createProxy } from "trpc-durable-objects";
import bcrypt from "bcryptjs";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "trpc-durable-objects";

import generateOTP from "../utils/otp";

interface Code {
  code?: string;
  codeExpireAt?: number;
  password?: string;
}

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;

const router = t.router;

enum StorageKeys {
  passwordHash = "password-hash",
}

const userRouter = router({
  createCode: publicProcedure
    .input(z.string().nullish())
    .query(async ({ input, ctx }) => {
      const result = {
        code: generateOTP(),
        expireAt: Date.now() + 300 * 1000,
      };

      await ctx.state.storage.put("code", JSON.stringify(result));

      return result;
    }),
  register: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const passwordHash = await ctx.state.storage.get<string>(
      StorageKeys.passwordHash
    );

    if (passwordHash) {
      throw new Error("Conflict");
    }

    await ctx.state.storage.put("password-hash", bcrypt.hashSync(input, 10));
  }),
  verfifyCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const codeJSON = await ctx.state.storage.get<string>("code");

      // Verify code
    }),
  validateCode: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const loginCode = await ctx.state.storage.get<Code>("login-code");

      if (!loginCode) {
        throw new Error("Code not found");
      }

      const ok =
        input === loginCode.code &&
        loginCode.codeExpireAt !== undefined &&
        Date.now() < loginCode.codeExpireAt;

      if (!ok) {
        throw new Error("Unauthorized");
      }

      // Remove once used
      await ctx.state.storage.delete("login-code");
    }),
  validatePassword: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const passwordHash = await ctx.state.storage.get<string>(
        StorageKeys.passwordHash
      );

      if (!passwordHash) {
        throw new Error("No password defined");
      }

      return bcrypt.compareSync(input, passwordHash);
    }),
});

type UserRouter = typeof userRouter;

export const User = createProxy<UserRouter>(userRouter);
