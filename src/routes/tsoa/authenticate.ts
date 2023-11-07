// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { UnauthenticatedError } from "../../errors";
import randomString from "../../utils/random-string";
import { AuthParams, Client, Env, Ticket } from "../../types";
import { HTTPException } from "hono/http-exception";

const TICKET_EXPIRATION_TIME = 30 * 60 * 1000;

export interface LoginError {
  error: string;
  error_description: string;
}

export interface LoginTicket {
  login_ticket: string;
  co_verifier: string;
  co_id: string;
}

export interface AuthenticateParams {
  client_id: string;
  username: string;
}

export interface CodeAuthenticateParams extends AuthenticateParams {
  credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp";
  realm: "email";
  otp: string;
}

export interface PasswordAuthenticateParams extends AuthenticateParams {
  credential_type: "http://auth0.com/oauth/grant-type/password-realm";
  realm: "Username-Password-Authentication";
  password: string;
}

@Route("co")
@Tags("authenticate")
export class AuthenticateController extends Controller {
  /**
   * The endpoint used to authenticate using an OTP or a password in auth0
   * @param body
   * @param request
   * @returns
   */
  @Post("authenticate")
  public async authenticate(
    @Body() body: CodeAuthenticateParams | PasswordAuthenticateParams,
    @Request() request: RequestWithContext,
  ): Promise<LoginTicket | LoginError | string> {
    const { env } = request.ctx;

    const client = await env.data.clients.get(body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const email = body.username.toLocaleLowerCase();
    let ticket: Ticket = {
      id: nanoid(),
      tenant_id: client.tenant_id,
      client_id: client.id,
      email: email,
      created_at: new Date(),
      expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME),
    };

    if ("otp" in body) {
      const otps = await env.data.OTP.list(client.tenant_id, email);
      const otp = otps.find((otp) => otp.code === body.otp);

      if (!otp) {
        throw new HTTPException(403);
      }

      ticket.authParams = otp.authParams;
    } else {
      const user = await env.data.users.getByEmail(client.tenant_id, email);

      if (!user) {
        throw new HTTPException(403);
      }

      const { valid } = await env.data.passwords.validate(client.tenant_id, {
        user_id: user.id,
        password: body.password,
      });

      if (!valid) {
        throw new HTTPException(403);
      }
    }

    await env.data.tickets.create(ticket);

    return {
      login_ticket: ticket.id,
      // TODO: I guess these should be validated when accepting the ticket
      co_verifier: randomString(32),
      co_id: randomString(12),
    };
  }
}
