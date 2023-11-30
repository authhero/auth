// Delete this file! It's put back just to delete it...

// should also be able to delete these TRPC dependencies
import { createProxy, Context } from "trpc-durable-objects";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Env } from "../types";

const t = initTRPC.context<Context<Env>>().create();

const publicProcedure = t.procedure;

const STATE = "state";

export const stateRouter = t.router({
  createState: publicProcedure
    .input(
      z.object({
        state: z.string(),
        ttl: z.number().default(300),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.state.storage.put(STATE, input.state);
      ctx.state.storage.setAlarm(Date.now() + input.ttl * 1000);
    }),
  getState: publicProcedure.query(async ({ input, ctx }) => {
    const state = await ctx.state.storage.get<string>(STATE);

    if (!state) {
      throw new Error("State not found");
    }

    return state;
  }),
  setState: publicProcedure
    .input(
      z.object({
        state: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.state.storage.put(STATE, input.state);
    }),
});

export async function stateAlarm(state: DurableObjectState) {
  console.log("Delete state");
  state.storage.deleteAll();
}

type StateRouter = typeof stateRouter;

export const State = createProxy<StateRouter>(stateRouter, stateAlarm);
export type StateClient = ReturnType<typeof State.getInstance>;
