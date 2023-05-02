import { Context } from "cloudworker-router";
import { Env } from "../types/Env";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFail = "LOGIN_FAIL",
  userCreate = "USER_CREATE",
  userUpdate = "USER_UPDATE",
}

export interface UserMessage {
  queueName: "users";
  userId: string;
  event: UserEvent;
}

export type QueueMessage = { tenantId: string } & UserMessage;

export async function sendUserEvent(
  ctx: Context<Env>,
  tenantId: string,
  userId: string,
  event: UserEvent
) {
  const message: QueueMessage = {
    userId,
    tenantId,
    queueName: "users",
    event,
  };

  await ctx.env.USERS_QUEUE.send(message);
}
