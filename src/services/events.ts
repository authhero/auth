import { handleUserEvent } from "../handlers/update-user";
import { Env } from "../types/Env";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFailed = "LOGIN_FAILED",
  userCreated = "USER_CREATED",
  userUpdated = "USER_UPDATED",
  userDeleted = "USER_DELETED",
}

export interface UserMessage {
  queueName: "users";
  email: string;
  userId: string;
  event: UserEvent;
}

export type QueueMessage = { tenantId: string } & UserMessage;

export async function sendUserEvent(
  env: Env,
  doId: string,
  userId: string,
  event: UserEvent,
) {
  const [tenantId, email] = doId.split("|");

  // TODO: This is a workaround to make the user model tests to pass. The DO's will be removed soon
  if (env.USER) {
    await handleUserEvent(env, tenantId, email, userId, event);
  }
}
