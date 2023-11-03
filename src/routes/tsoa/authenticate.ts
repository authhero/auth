// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { nanoid } from "nanoid";
import { UnauthenticatedError } from "../../errors";
import randomString from "../../utils/random-string";
import { Ticket } from "../../types";

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
  ): Promise<LoginTicket | LoginError> {
    const { env } = request.ctx;

    const client = await env.data.clients.get(body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const email = body.username.toLocaleLowerCase();

    const otps = await env.data.OTP.list(client.tenant_id, email);
    if ("otp" in body) {
      const otp = otps.find((otp) => otp.code === body.otp);

      if (!otp) {
        throw new UnauthenticatedError("Code not found or expired");
      }

      const ticket: Ticket = {
        id: nanoid(),
        tenant_id: client.tenant_id,
        client_id: client.id,
        email: otp.email,
        authParams: otp.authParams,
        created_at: new Date(),
        expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME),
      };

      await env.data.tickets.create(ticket);

      return {
        login_ticket: ticket.id,
        // TODO: I guess these should be validated when accepting the ticket
        co_verifier: randomString(32),
        co_id: randomString(12),
      };
    } else {
      throw new Error("Password not supported yet");
    }

    // const user = env.userFactory.getInstanceByName(
    //   getId(client.tenant_id, email),
    // );

    // try {
    //   switch (body.realm) {
    //     case "email":
    //       await user.validateAuthenticationCode.mutate({
    //         code: body.otp,
    //         email: email,
    //         tenantId: client.tenant_id,
    //       });
    //       break;
    //     case "Username-Password-Authentication":
    //       await user.validatePassword.mutate({
    //         password: body.password,
    //         email: email,
    //         tenantId: client.tenant_id,
    //       });
    //       break;
    //     default:
    //       throw new Error("Unsupported realm");
    //   }

    //   const coVerifier = randomString(32);
    //   const coID = randomString(12);

    //   const profile = await handleLinkedAccount(
    //     env,
    //     await user.getProfile.query(),
    //   );

    //   const payload = {
    //     coVerifier,
    //     coID,
    //     username: profile.email,
    //     userId: `${client.tenant_id}|${profile.email}`,
    //     authParams: {
    //       client_id: body.client_id,
    //       user: profile,
    //     },
    //   };

    //   const stateId = env.STATE.newUniqueId().toString();
    //   const stateInstance = env.stateFactory.getInstanceById(stateId);
    //   await stateInstance.createState.mutate({
    //     state: JSON.stringify(payload),
    //   });

    //   this.setHeader(headers.contentType, contentTypes.json);
    //   return {
    //     login_ticket: hexToBase64(stateId),
    //     co_verifier: coVerifier,
    //     co_id: coID,
    //   };
    // } catch (err: any) {
    //   this.setStatus(403);
    //   this.setHeader(headers.contentType, contentTypes.json);

    //   if (err instanceof AuthenticationCodeExpiredError) {
    //     return {
    //       error: "access_denied",
    //       error_description:
    //         "The verification code has expired. Please try to login again.",
    //     };
    //   }

    //   if (err instanceof InvalidCodeError) {
    //     return {
    //       error: "access_denied",
    //       error_description: "Wrong email or verification code.",
    //     };
    //   }

    //   if (err instanceof UnauthenticatedError) {
    //     return {
    //       error: "access_denied",
    //       error_description: "Wrong email or password.",
    //     };
    //   }

    //   return {
    //     error: "access_denied",
    //     error_description: `Server error: ${err.message}`,
    //   };
    // }
  }
}
