import {
  Controller,
  Get,
  Post,
  Request,
  Route,
  Tags,
  Body,
  Query,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";
import userIdGenerate from "../../utils/userIdGenerate";
import { HTTPException } from "hono/http-exception";
import generateOTP from "../../utils/otp";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import {
  renderMessage,
  renderForgotPassword,
  renderResetPassword,
  renderSignup,
  renderLogin,
  renderLoginWithCode,
  renderEnterCode,
  renderEmailValidation,
} from "../../templates/render";
import { AuthorizationResponseType, Env, User } from "../../types";
import { headers } from "../../constants";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { sendResetPassword } from "../../controllers/email";
import { validateCode } from "../../authentication-flows/passwordless";
import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";
import { getUserByEmailAndProvider, getUsersByEmail } from "../../utils/users";

// duplicated from /passwordless route
const CODE_EXPIRATION_TIME = 30 * 60 * 1000;

interface LoginParams {
  username: string;
  password: string;
}

interface PasswordResetParams {
  username: string;
}

async function handleLogin(
  env: Env,
  controller: Controller,
  user: User,
  session: UniversalLoginSession,
) {
  if (session.authParams.redirect_uri) {
    const responseType =
      session.authParams.response_type ||
      AuthorizationResponseType.TOKEN_ID_TOKEN;

    const authResponse = await generateAuthResponse({
      env,
      userId: user.id,
      sid: nanoid(),
      responseType,
      authParams: session.authParams,
      user,
    });

    return applyTokenResponse(controller, authResponse, session.authParams);
  }

  // This is just a fallback in case no redirect was present
  return renderMessage(env, controller, {
    ...session,
    page_title: "Logged in",
    message: "You are logged in",
  });
}

@Route("u")
@Tags("login ui")
export class LoginController extends Controller {
  /**
   * Renders a login form
   * @param request
   */
  @Get("login")
  public async getLogin(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderLogin(env, this, session, state);
  }

  /**
   * Renders a code login form
   * @param request
   */
  @Get("code")
  public async getLoginWithCode(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderLoginWithCode(env, this, session);
  }

  /**
   * Sends a code to the email (username) entered
   * @param request
   */
  @Post("code")
  public async getCode(
    @Request() request: RequestWithContext,
    @Body() params: { username: string },
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const client = await getClient(env, session.authParams.client_id);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const code = generateOTP();

    // fields in universalLoginSessions don't match fields in OTP
    const {
      audience,
      code_challenge_method,
      code_challenge,
      username,
      ...otpAuthParams
    } = session.authParams;

    await env.data.OTP.create({
      id: nanoid(),
      code,
      // is this a reasonable assumption?
      email: params.username,
      client_id: session.authParams.client_id,
      send: "code",
      authParams: otpAuthParams,
      tenant_id: client.tenant_id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
    });

    request.ctx.set("log", `Code: ${code}`);

    // Add the username to the state
    session.authParams.username = params.username;
    await env.data.universalLoginSessions.update(session.id, session);

    const magicLink = new URL(env.ISSUER);
    magicLink.pathname = "passwordless/verify_redirect";
    if (session.authParams.scope) {
      magicLink.searchParams.set("scope", session.authParams.scope);
    }
    if (session.authParams.response_type) {
      magicLink.searchParams.set(
        "response_type",
        session.authParams.response_type,
      );
    }
    if (session.authParams.redirect_uri) {
      magicLink.searchParams.set(
        "redirect_uri",
        session.authParams.redirect_uri,
      );
    }
    if (session.authParams.audience) {
      magicLink.searchParams.set("audience", session.authParams.audience);
    }
    if (session.authParams.state) {
      magicLink.searchParams.set("state", session.authParams.state);
    }
    if (session.authParams.nonce) {
      magicLink.searchParams.set("nonce", session.authParams.nonce);
    }

    magicLink.searchParams.set("connection", "email");
    magicLink.searchParams.set("client_id", session.authParams.client_id);
    magicLink.searchParams.set("email", session.authParams.username);
    magicLink.searchParams.set("verification_code", code);

    await env.data.email.sendLink(
      env,
      client,
      params.username,
      code,
      magicLink.href,
    );

    this.setHeader(
      headers.location,
      `/u/enter-code?state=${state}&username=${params.username}`,
    );
    this.setStatus(302);

    return "Redirect";
  }

  /**
   * Renders a code submit form
   * @param request
   */
  @Get("enter-code")
  public async getEnterCode(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
    @Query("username") username: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderEnterCode(env, this, session);
  }

  /**
   * Posts a code
   * @param request
   */
  @Post("enter-code")
  public async postCode(
    @Request() request: RequestWithContext,
    @Body() params: { code: string },
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    if (!session.authParams.username) {
      throw new HTTPException(400, { message: "Username not found in state" });
    }

    try {
      const user = await validateCode(env, {
        client_id: session.authParams.client_id,
        email: session.authParams.username,
        verification_code: params.code,
      });

      const tokenResponse = await generateAuthResponse({
        env,
        userId: user.id,
        sid: nanoid(),
        responseType:
          session.authParams.response_type ||
          AuthorizationResponseType.TOKEN_ID_TOKEN,
        authParams: session.authParams,
        user,
      });

      return applyTokenResponse(this, tokenResponse, session.authParams);
    } catch (err) {
      return renderEnterCode(env, this, session, "Invlalid code");
    }
  }

  /**
   * Validates a link sent to the user's email
   */
  @Get("validate-email") // a GET that mutates data... interesting, but the only way?
  public async postValidateEmail(
    @Request() request: RequestWithContext,
    @Query("code") code: string,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const email = session.authParams.username;
    if (!email) {
      throw new HTTPException(400, { message: "Username not found in state" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    const codes = await env.data.codes.list(client.tenant_id, email);
    const foundCode = codes.find((storedCode) => storedCode.code === code);

    if (!foundCode) {
      return renderEnterCode(env, this, session, "Code not found or expired");
    }

    const user = getUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email,
      provider: "auth2",
    });
    if (!user) {
      throw new HTTPException(500, { message: "No user found" });
    }

    // TODO - now need to update the user to be verified

    // what should we actually do here?
    return "email validated";
  }

  /**
   * Renders a signup user form
   * @param request
   */
  @Get("signup")
  public async getSignup(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderSignup(env, this, session, state);
  }

  @Post("signup")
  public async postSignup(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    if (session.authParams.username !== loginParams.username) {
      session.authParams.username = loginParams.username;
      await env.data.universalLoginSessions.update(session.id, session);
    }

    try {
      // TODO - filter by primary user
      let [user] = await getUsersByEmail(
        env.data.users,
        client.tenant_id,
        loginParams.username,
      );

      if (!user) {
        // Create the user if it doesn't exist
        user = await env.data.users.create(client.tenant_id, {
          id: `auth2|${userIdGenerate()}`,
          email: loginParams.username,
          name: loginParams.username,
          provider: "auth2",
          connection: "Username-Password-Authentication",
          email_verified: false,
          last_ip: "",
          login_count: 0,
          is_social: false,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await env.data.passwords.create(client.tenant_id, {
        user_id: user.id,
        password: loginParams.password,
      });

      // if (client.email_validation === "enforced") {
      //   // Update the username in the state
      //   await setLoginState(env, state, {
      //     ...loginState,
      //     authParams: {
      //       ...loginState.authParams,
      //       username: loginParams.username,
      //     },
      //   });

      //   return renderEmailValidation(env.AUTH_TEMPLATES, this, loginState);
      // }

      return handleLogin(env, this, user, session);
    } catch (err: any) {
      return renderSignup(env, this, session, state, err.message);
    }
  }

  /**
   * Renders a forgot password form
   * @param request
   */
  @Get("forgot-password")
  public async getForgotPassword(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderForgotPassword(env, this, session, state);
  }

  /**
   * Renders a forgot password form
   * @param request
   */
  @Post("forgot-password")
  public async postForgotPassword(
    @Request() request: RequestWithContext,
    @Body() params: PasswordResetParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const client = await getClient(env, session.client_id);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    if (session.authParams.username !== params.username) {
      session.authParams.username = params.username;
      await env.data.universalLoginSessions.update(session.id, session);
    }

    const user = await getUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email: params.username,
      provider: "Username-Password-Authentication",
    });

    if (user) {
      const code = generateOTP();

      await env.data.codes.create(client.tenant_id, {
        id: nanoid(),
        code,
        type: "password_reset",
        user_id: user.id,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
      });

      request.ctx.set("log", `Code: ${code}`);

      await sendResetPassword(env, client, params.username, code, state);
    } else {
      console.log("User not found");
    }

    return renderMessage(env, this, {
      ...session,
      page_title: "Password reset",
      message: "A code has been sent to your email address",
    });
  }

  /**
   * Renders a reset password form
   * @param request
   */
  @Get("reset-password")
  // in auth0 this is called reset-verify
  public async getResetPassword(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    return renderResetPassword(env, this, session);
  }

  /**
   * Renders a reset password form
   * @param request
   */
  @Post("reset-password")
  public async postResetPassword(
    @Request() request: RequestWithContext,
    @Body() params: { password: string },
    @Query("state") state: string,
    @Query("code") code: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    if (!session.authParams.username) {
      throw new HTTPException(400, { message: "Username required" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    // Note! we don't use the primary user here. Something to be careful of
    // this means the primary user could have a totally different email address
    const user = await getUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email: session.authParams.username,
      provider: "auth2",
    });

    if (!user) {
      throw new HTTPException(400, { message: "User not found" });
    }

    try {
      const codes = await env.data.codes.list(client.tenant_id, user.id);
      const foundCode = codes.find((storedCode) => storedCode.code === code);

      if (!foundCode) {
        return renderEnterCode(env, this, session, "Code not found or expired");
      }

      await env.data.passwords.update(client.tenant_id, {
        user_id: user.id,
        password: params.password,
      });
    } catch (err) {
      return renderMessage(env, this, {
        ...session,
        page_title: "Password reset",
        message: "The password could not be reset",
      });
    }

    return renderMessage(env, this, {
      ...session,
      page_title: "Password reset",
      message: "The password has been reset",
    });
  }

  @Post("login")
  public async postLogin(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    const client = await getClient(env, session.authParams.client_id);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    // TODO - wait, each of these is different! need to search by  email AND provider, and then return the primary user...
    const [user] = await env.data.users.getByEmail(
      client.tenant_id,
      loginParams.username,
    );

    if (!user) {
      throw new HTTPException(400, { message: "User not found" });
    }

    try {
      const { valid } = await env.data.passwords.validate(client.tenant_id, {
        user_id: user.id,
        password: loginParams.password,
      });

      if (!valid) {
        return renderLogin(env, this, session, state, "Invalid password");
      }

      return handleLogin(env, this, user, session);
    } catch (err: any) {
      return renderLogin(env, this, session, err.message);
    }
  }

  /**
   * Renders a info page for the user
   * @param request
   */
  @Get("info")
  public async info(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
    @Query("code") code: string,
  ): Promise<string> {
    const { env } = request.ctx;

    return renderMessage(env, this, {
      page_title: "User info",
      message: `Not implemented`,
    });
  }
}
