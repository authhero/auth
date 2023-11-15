import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Tags,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";
import { RequestWithContext } from "../../types/RequestWithContext";
import { AuthParams, AuthorizationResponseType } from "../../types/AuthParams";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { setSilentAuthCookies } from "../../helpers/silent-auth-cookie";
import { headers } from "../../constants";
import generateOTP from "../../utils/otp";
import { UnauthenticatedError } from "../../errors";
import { Profile } from "../../types";

const CODE_EXPIRATION_TIME = 30 * 60 * 1000;

export interface PasswordlessOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send: "link" | "code";
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

function getLocalePath(locale: string) {
  if (locale === "en") return "";

  return `/${locale}`;
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

    const client = await env.data.clients.get(body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }
    const email = body.email.toLocaleLowerCase();

    const code = generateOTP();

    await env.data.OTP.create({
      id: nanoid(),
      code,
      email,
      client_id: body.client_id,
      send: body.send,
      authParams: body.authParams,
      tenant_id: client.tenant_id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
    });

    request.ctx.set("log", `Code: ${code}`);

    if (body.send === "link") {
      const magicLink = new URL(env.ISSUER);
      magicLink.pathname = "passwordless/verify_redirect";
      if (body.authParams.scope) {
        magicLink.searchParams.set("scope", body.authParams.scope);
      }
      if (body.authParams.response_type) {
        magicLink.searchParams.set(
          "response_type",
          body.authParams.response_type,
        );
      }
      if (body.authParams.redirect_uri) {
        magicLink.searchParams.set(
          "redirect_uri",
          body.authParams.redirect_uri,
        );
      }
      if (body.authParams.audience) {
        magicLink.searchParams.set("audience", body.authParams.audience);
      }
      if (body.authParams.state) {
        magicLink.searchParams.set("state", body.authParams.state);
      }
      if (body.authParams.nonce) {
        magicLink.searchParams.set("nonce", body.authParams.nonce);
      }

      magicLink.searchParams.set("connection", body.connection);
      magicLink.searchParams.set("client_id", body.client_id);
      magicLink.searchParams.set("email", email);
      magicLink.searchParams.set("verification_code", code);

      await env.data.email.sendLink(env, client, email, code, magicLink.href);
    } else {
      await env.data.email.sendCode(env, client, email, code);
    }

    return "OK";
  }

  @Get("verify_redirect")
  public async verifyRedirect(
    @Request() request: RequestWithContext,
    @Query("scope") scope: string,
    @Query("response_type") response_type: AuthorizationResponseType,
    @Query("redirect_uri") redirect_uri: string,
    @Query("state") state: string,
    @Query("nonce") nonce: string,
    @Query("verification_code") verification_code: string,
    @Query("connection") connection: string,
    @Query("client_id") client_id: string,
    @Query("email") email: string,
    @Query("audience") audience?: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await env.data.clients.get(client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    try {
      const otps = await env.data.OTP.list(client.tenant_id, email);
      const otp = otps.find((otp) => otp.code === verification_code);

      if (!otp) {
        throw new UnauthenticatedError("Code not found or expired");
      }

      let user = await env.data.users.getByEmail(client.tenant_id, email);
      if (!user) {
        user = await env.data.users.create(client.tenant_id, {
          // this is inconsitent. In other places the ID is just the ID
          // I think this is where we're going to hit serious issues...
          // Shouldn't this be done in the sub?
          // OR IDEALLY have the users.create handle this?
          // id: `${client.tenant_id}|${nanoid()}`,
          email,
          name: email,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      /*
      we also need to set this like in the User Model

      connections: [
        {
          name: "email",
          profile: {
            email: input.email,
            validated: true,
          },
        },
      ],
      */

      validateRedirectUrl(client.allowed_callback_urls, redirect_uri);

      const authParams: AuthParams = {
        client_id,
        redirect_uri,
        state,
        scope,
        audience,
      };

      const profile: Profile = {
        ...user,
        connections: [],
        id: user.user_id,
        tenant_id: client.tenant_id,
      };

      const sessionId = await setSilentAuthCookies(
        env,
        this,
        client.tenant_id,
        client.id,
        profile,
      );

      const tokenResponse = await generateAuthResponse({
        responseType: response_type,
        env,
        userId: user.id,
        sid: sessionId,
        state,
        nonce,
        user: profile,
        authParams,
      });

      return applyTokenResponse(this, tokenResponse, authParams);
    } catch (e) {
      // Ideally here only catch AuthenticationCodeExpiredError
      // redirect here always to login2.sesamy.dev/expired-code

      const localePath = getLocalePath(client.tenant.language || "sv");

      const login2ExpiredCodeUrl = new URL(
        `${env.LOGIN2_URL}${localePath}/expired-code`,
      );

      const stateDecoded = new URLSearchParams(state);

      login2ExpiredCodeUrl.searchParams.set("email", encodeURIComponent(email));

      const redirectUri = stateDecoded.get("redirect_uri");
      if (redirectUri) {
        login2ExpiredCodeUrl.searchParams.set("redirect_uri", redirectUri);
      }

      const audience = stateDecoded.get("audience");
      if (audience) {
        login2ExpiredCodeUrl.searchParams.set("audience", audience);
      }

      const nonce = stateDecoded.get("nonce");
      if (nonce) {
        login2ExpiredCodeUrl.searchParams.set("nonce", nonce);
      }

      const scope = stateDecoded.get("scope");
      if (scope) {
        login2ExpiredCodeUrl.searchParams.set("scope", scope);
      }

      const responseType = stateDecoded.get("response_type");
      if (responseType) {
        login2ExpiredCodeUrl.searchParams.set("response_type", responseType);
      }

      const state2 = stateDecoded.get("state");
      if (state2) {
        login2ExpiredCodeUrl.searchParams.set("state", state2);
      }

      const client_id = stateDecoded.get("client_id");
      if (client_id) {
        login2ExpiredCodeUrl.searchParams.set("client_id", client_id);
      }

      // this will always be auth2
      const connection2 = stateDecoded.get("connection");
      if (connection2) {
        login2ExpiredCodeUrl.searchParams.set("connection", connection2);
      }

      this.setHeader(headers.location, login2ExpiredCodeUrl.toString());

      this.setStatus(302);

      return "Redirecting";
    }
  }
}
