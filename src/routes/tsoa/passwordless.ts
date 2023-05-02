// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import sendEmail from "../../services/email";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getId, User } from "../../models/User";
import { getClient } from "../../services/clients";
import { contentTypes, headers } from "../../constants";
import { AuthenticationCodeExpiredError, InvalidCodeError } from "../../errors";
import { createState } from "../../models";
import randomString from "../../utils/random-string";
import { hexToBase64 } from "../../utils/base64";
import { AuthParams } from "../../types/AuthParams";

export interface PasssworlessOptions {
  client_id: string;
  client_secret?: string;
  connection: "email";
  email: string;
  send?: "link" | "code";
  authParams?: AuthParams;
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
  public async startPasswordless(
    @Body() body: PasssworlessOptions,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = User.getInstanceByName(ctx.env.USER, body.email);
    const { code } = await user.createAuthenticationCode.mutate({
      authParams: body.authParams!,
    });

    const client = await getClient(ctx.env, body.client_id);

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
      const authParams = await user.validateAuthenticationCode.mutate(body.otp);

      const coVerifier = randomString(32);
      const coID = randomString(12);

      const { id: stateId } = await createState(
        ctx.env.STATE,
        JSON.stringify({
          coVerifier,
          coID,
          username: body.username,
          userId: getId(body.client_id, body.username),
          authParams,
        })
      );

      this.setHeader(headers.contentType, contentTypes.json);
      return {
        login_ticket: hexToBase64(stateId),
        co_verifier: coVerifier,
        co_id: coID,
      };
    } catch (err: any) {
      this.setStatus(401);
      this.setHeader(headers.contentType, contentTypes.json);

      if (err instanceof AuthenticationCodeExpiredError) {
        return {
          error: "access_denied",
          error_description:
            "The verification code has expired. Please try to login again.",
        };
      }

      if (err instanceof InvalidCodeError) {
        return {
          error: "access_denied",
          error_description: "Wrong email or verification code.",
        };
      }

      return {
        error: "access_denied",
        error_description: `Server error: ${err.message}`,
      };
    }
  }
}
