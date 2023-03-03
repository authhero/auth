import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { User } from "../types/UserMetadata";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFail = "LOGIN_FAIL",
  userCreate = "USER_CREATE",
}

export interface UserMessage extends User {
  queueName: "users";
  event: UserEvent;
}

export type QueueMessage = UserMessage;

export async function userEvent(
  ctx: Context<Env>,
  user: User,
  event: UserEvent
) {
  const message: QueueMessage = {
    ...user,
    queueName: "users",
    event,
  };

  await ctx.env.USER_QUEUE.send(message);
}
