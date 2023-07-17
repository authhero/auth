import { Env } from "../types/Env";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFailed = "LOGIN_FAILED",
  userCreated = "USER_CREATED",
  userUpdated = "USER_UPDATED",
}

export interface UserMessage {
  queueName: "users";
  userId: string;
  event: UserEvent;
}

export type QueueMessage = { tenantId: string } & UserMessage;

export async function sendUserEvent(
  queue: Queue<QueueMessage>,
  doId: string,
  event: UserEvent,
) {
  const [tenantId, userId] = doId.split("|");

  const message: QueueMessage = {
    userId,
    tenantId,
    queueName: "users",
    event,
  };

  await queue.send(message);
}
