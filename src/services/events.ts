import { updateUser } from "../handlers/update-user";
import { Env } from "../types/Env";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFailed = "LOGIN_FAILED",
  userCreated = "USER_CREATED",
  userUpdated = "USER_UPDATED",
}

export interface UserMessage {
  queueName: "users";
  email: string;
  event: UserEvent;
}

export type QueueMessage = { tenantId: string } & UserMessage;

export async function sendUserEvent(env: Env, doId: string, event: UserEvent) {
  const [tenantId, email] = doId.split("|");

  if (env.USERS_QUEUE) {
    const message: QueueMessage = {
      email,
      tenantId,
      queueName: "users",
      event,
    };

    await env.USERS_QUEUE.send(message);
  } else {
    await updateUser(env, tenantId, email);
  }
}
