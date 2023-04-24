import { createProxy, Context } from "trpc-durable-objects";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;

const router = t.router;

const STATE = "state";

export const stateRouter = router({
  createState: publicProcedure
    .input(
      z.object({
        state: z.string(),
        ttl: z.number().default(300),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.state.storage.put(STATE, input.state);
      ctx.state.storage.setAlarm(Date.now() + input.ttl * 1000);
    }),
  getState: publicProcedure.query(async ({ input, ctx }) => {
    const state = await ctx.state.storage.get<string>(STATE);

    return state;
  }),
});

export async function stateAlarm(state: DurableObjectState) {
  console.log("Delete state");
  state.storage.deleteAll();
}

type StateRouter = typeof stateRouter;

export const State = createProxy<StateRouter>(stateRouter, stateAlarm);

export async function createState(
  namespace: DurableObjectNamespace,
  state?: any,
  ttl?: number
) {
  const durableObjectId = namespace.newUniqueId();
  const instance = State.getInstance(namespace, durableObjectId);

  if (state) {
    await instance.createState.mutate({
      state: typeof state === "object" ? JSON.stringify(state) : state,
      ttl,
    });
  }

  return {
    instance,
    id: durableObjectId.toString(),
  };
}
