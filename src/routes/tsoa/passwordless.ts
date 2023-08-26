// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { AuthParams } from "../../types/AuthParams";
import { Env } from "../../types";
import {
  sendCode,
} from "../../controllers/email";

export interface PasswordlessOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send: string;
  authParams: Omit<AuthParams, "client_id">;
}

export interface LoginTicket {
  login_ticket: string;
  co_verifier: string;
  co_id: string;
}

export interface LoginError {
  error: string;
  error_description: string;
}

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("start")
  public async startPasswordless(
    @Body() body: PasswordlessOptions,
    @Request() request: RequestWithContext,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await getClient(env, body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      `${client.tenantId}|${body.email}`,
    );
    const { code } = await user.createAuthenticationCode.mutate({
      authParams: {
        ...body.authParams,
        client_id: body.client_id,
      },
    });

    console.log('created code ok');

    console.log('sending email')

      await sendCode(env, client, body.email, code);

    return "ok";
  }
}
