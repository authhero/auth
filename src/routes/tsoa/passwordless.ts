// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import sendEmail from "../../services/email";
import { RequestWithContext } from "../../types/RequestWithContext";
import { User } from "../../models/User";
import { getClient } from "../../services/clients";
import { contentTypes, headers } from "../../constants";
import { AuthenticationCodeExpired } from "../../errors";

export interface PasssworlessOptions {
  client_id: string;
  client_secret?: string;
  connection: "email";
  email: string;
  send?: "link" | "code";
  authParams?: {
    response_type?: string;
    redirect_uri?: string;
    audience?: string;
    state?: string;
    nonce?: string;
    scope?: string;
  };
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

@Route("")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("passwordless/start")
  public async getUser(
    @Body() body: PasssworlessOptions,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = User.getInstanceByName(ctx.env.USER, body.email);
    const { code } = await user.createAuthenticationCode.mutate();

    const client = await getClient(ctx, body.client_id);

    const message = `Here's your login code: ${code}`;
    await sendEmail({
      to: [{ email: body.email, name: "" }],
      from: {
        email: client.senderEmail,
        name: client.senderName,
      },
      content: [
        {
          type: "text/plain",
          value: message,
        },
      ],
      subject: "Login code",
    });

    return "ok";
  }

  /**
   * The endpoint used to authenticate using an OTP in auth0
   * @param body
   * @param request
   * @returns
   */
  @Post("co/authenticate")
  public async validateOTP(
    @Body()
    body: {
      client_id: string;
      username: string;
      otp: string;
      realm: "email";
      credential_type: string;
    },
    @Request() request: RequestWithContext
  ): Promise<LoginTicket | LoginError> {
    const { ctx } = request;

    const user = User.getInstanceByName(ctx.env.USER, body.username);
    try {
      await user.validateAuthenticationCode.mutate(body.otp);

      this.setHeader(headers.contentType, contentTypes.json);
      return {
        login_ticket: "v6jJzfGgd1BLdQdQCfYgTUdnAkRzCjcA",
        co_verifier: "WFLZu4rZim_AlCHRvOLYLUogrN20v2kW",
        co_id: "7MPaWjDjeFL0",
      };
    } catch (err) {
      this.setStatus(401);
      this.setHeader(headers.contentType, contentTypes.json);

      if (err instanceof AuthenticationCodeExpired) {
        return {
          error: "access_denied",
          error_description:
            "The verification code has expired. Please try to login again.",
        };
      }

      return {
        error: "access_denied",
        error_description: "Wrong email or verification code.",
      };
    }
  }
}
