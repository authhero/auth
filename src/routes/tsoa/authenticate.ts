import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import randomString from "../../utils/random-string";
import { Ticket } from "../../types";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { LogTypes } from "../../tsoa-middlewares/logger";

const TICKET_EXPIRATION_TIME = 30 * 60 * 1000;

interface LoginError {
  error: string;
  error_description: string;
}

export interface LoginTicket {
  login_ticket: string;
  co_verifier: string;
  co_id: string;
}

interface AuthenticateParams {
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

    const client = await getClient(env, body.client_id);

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

      request.ctx.set("logType", LogTypes.FAILED_LOGIN_WRONG_PASSWORD);

      if (!otp) {
        throw new HTTPException(403, {
          res: new Response(
            JSON.stringify({
              error: "access_denied",
              error_description: "Wrong email or verification code.",
            }),
            {
              status: 403, // without this it returns a 200
              headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        });
      }

      ticket.authParams = otp.authParams;
    } else {
      // TODO - filter this don't just take first
      const [user] = await env.data.users.getByEmail(client.tenant_id, email);

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
