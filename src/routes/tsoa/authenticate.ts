// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { contentTypes, headers } from "../../constants";
import {
  AuthenticationCodeExpiredError,
  InvalidCodeError,
  UnauthenticatedError,
} from "../../errors";
import randomString from "../../utils/random-string";
import { hexToBase64 } from "../../utils/base64";
import { AuthParams, AuthorizationResponseType, Env } from "../../types";

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
  ): Promise<LoginTicket | LoginError> {
    const { env } = request.ctx;

    const client = await getClient(env, body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      `${client.tenantId}|${body.username}`,
    );

    let authParams: AuthParams | undefined = {
      client_id: client.id,
    };

    try {
      switch (body.realm) {
        case "email":
          await user.validateAuthenticationCode.mutate({
            code: body.otp,
            email: body.username,
            tenantId: client.tenantId,
          });
          break;
        case "Username-Password-Authentication":
          await user.validatePassword.mutate({
            password: body.password,
            email: body.username,
            tenantId: client.tenantId,
          });
          break;
        default:
          throw new Error("Unsupported realm");
      }

      const coVerifier = randomString(32);
      const coID = randomString(12);

      const payload = {
        coVerifier,
        coID,
        username: body.username,
        userId: `${client.tenantId}|${body.username}`,
        authParams,
      };

      const stateId = env.STATE.newUniqueId().toString();
      const stateInstance = env.stateFactory.getInstanceById(stateId);
      await stateInstance.createState.mutate({
        state: JSON.stringify(payload),
      });

      this.setHeader(headers.contentType, contentTypes.json);
      return {
        login_ticket: hexToBase64(stateId),
        co_verifier: coVerifier,
        co_id: coID,
      };
    } catch (err: any) {
      this.setStatus(403);
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

      if (err instanceof UnauthenticatedError) {
        return {
          error: "access_denied",
          error_description: "Wrong email or password.",
        };
      }

      return {
        error: "access_denied",
        error_description: `Server error: ${err.message}`,
      };
    }
  }
}
