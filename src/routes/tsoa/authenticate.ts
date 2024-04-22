import {
  Body,
  Controller,
  Post,
  Request,
  Route,
  Tags,
  Middlewares,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import randomString from "../../utils/random-string";
import { Ticket } from "../../types";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { loggerMiddleware } from "../../tsoa-middlewares/logger";
import { LogTypes } from "../../types";
import { getUserByEmailAndProvider } from "../../utils/users";

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
  @Middlewares(loggerMiddleware())
  public async authenticate(
    @Body() body: CodeAuthenticateParams | PasswordAuthenticateParams,
    @Request() request: RequestWithContext,
  ): Promise<LoginTicket | LoginError | string> {
    const { env } = request.ctx;

    const client = await getClient(env, body.client_id);

    if (!client) {
      throw new Error("Client not found");
    }
    await request.ctx.set("client_id", client.id);
    await request.ctx.set("tenantId", client.tenant_id);

    const email = body.username.toLocaleLowerCase();
    request.ctx.set("userName", email);

    let ticket: Ticket = {
      id: nanoid(),
      tenant_id: client.tenant_id,
      client_id: client.id,
      email: email,
      created_at: new Date(),
      expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME),
    };

    if ("otp" in body) {
      request.ctx.set("connection", "email");
      const otps = await env.data.OTP.list(client.tenant_id, email);
      const otp = otps.find((otp) => otp.code === body.otp);

      if (otp?.user_id) {
        request.ctx.set("userId", otp.user_id);
      }

      if (!otp) {
        request.ctx.set("logType", LogTypes.FAILED_CROSS_ORIGIN_AUTHENTICATION);
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
          message: "Wrong email or verification code.",
        });
      }

      // TODO - use validateCode() helper common code here
      await env.data.OTP.remove(client.tenant_id, otp.id);

      ticket.authParams = otp.authParams;
    } else {
      request.ctx.set("connection", "Username-Password-Authentication");

      // we do not want to fetch a primary user here we want the auth2 user
      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant_id,
        email,
        provider: "auth2",
      });

      if (!user) {
        throw new HTTPException(403);
      }

      const { valid } = await env.data.passwords.validate(client.tenant_id, {
        user_id: user.id,
        password: body.password,
      });

      request.ctx.set("userId", user.id);

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
