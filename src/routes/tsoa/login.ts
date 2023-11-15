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
import generateOTP from "../../utils/otp";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getId } from "../../models/User";
import { LoginState } from "../../types/LoginState";
import { base64ToHex } from "../../utils/base64";
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
import {
  AuthParams,
  AuthorizationResponseType,
  Env,
  Profile,
} from "../../types";
import { InvalidRequestError } from "../../errors";
import { headers } from "../../constants";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import {
  sendLink,
  sendEmailValidation,
  sendResetPassword,
} from "../../controllers/email";

// duplicated from /passwordless route
const CODE_EXPIRATION_TIME = 30 * 60 * 1000;

export interface LoginParams {
  username: string;
  password: string;
}

export interface PasswordResetParams {
  username: string;
}

export interface ResetPasswordState {
  username: string;
  code: string;
  client_id: string;
}

async function getLoginState(env: Env, state: string): Promise<LoginState> {
  const stateInstance = env.stateFactory.getInstanceById(base64ToHex(state));
  const loginString = await stateInstance.getState.query();
  const loginState: LoginState = JSON.parse(loginString);

  return loginState;
}

async function setLoginState(env: Env, state: string, data: LoginState) {
  const stateInstance = env.stateFactory.getInstanceById(base64ToHex(state));
  await stateInstance.setState.mutate({ state: JSON.stringify(data) });
}

async function handleLogin(
  env: Env,
  controller: Controller,
  profile: Profile,
  loginState: LoginState,
) {
  if (loginState.authParams.redirect_uri) {
    const responseType =
      loginState.authParams.response_type ||
      AuthorizationResponseType.TOKEN_ID_TOKEN;
    const authResponse = await generateAuthResponse({
      env,
      userId: profile.id,
      sid: nanoid(),
      responseType,
      authParams: loginState.authParams,
      user: profile,
    });
    return applyTokenResponse(controller, authResponse, loginState.authParams);
  }

  // This is just a fallback in case no redirect was present
  return renderMessage(env.AUTH_TEMPLATES, controller, {
    ...loginState,
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
    const loginState = await getLoginState(env, state);

    return renderLogin(env.AUTH_TEMPLATES, this, loginState);
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
    const loginState = await getLoginState(env, state);

    return renderLoginWithCode(env.AUTH_TEMPLATES, this, loginState);
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
    const loginState = await getLoginState(env, state);

    const client = await getClient(env, loginState.authParams.client_id);

    const code = generateOTP();

    await env.data.OTP.create({
      id: nanoid(),
      code,
      // is this a reasonable assumption?
      email: params.username,
      client_id: loginState.authParams.client_id,
      send: "code",
      authParams: loginState.authParams,
      tenant_id: client.tenant_id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
    });

    request.ctx.set("log", `Code: ${code}`);

    await env.data.logs.create({
      category: "login",
      message: "Create authentication code",
      tenant_id: client.tenant_id,
      user_id: params.username,
    });

    // Add the username to the state
    loginState.authParams.username = params.username;
    await setLoginState(env, state, loginState);

    const magicLink = new URL(env.ISSUER);
    magicLink.pathname = "passwordless/verify_redirect";
    if (loginState.authParams.scope) {
      magicLink.searchParams.set("scope", loginState.authParams.scope);
    }
    if (loginState.authParams.response_type) {
      magicLink.searchParams.set(
        "response_type",
        loginState.authParams.response_type,
      );
    }
    if (loginState.authParams.redirect_uri) {
      magicLink.searchParams.set(
        "redirect_uri",
        loginState.authParams.redirect_uri,
      );
    }
    if (loginState.authParams.audience) {
      magicLink.searchParams.set("audience", loginState.authParams.audience);
    }
    if (loginState.authParams.state) {
      magicLink.searchParams.set("state", loginState.authParams.state);
    }
    if (loginState.authParams.nonce) {
      magicLink.searchParams.set("nonce", loginState.authParams.nonce);
    }

    magicLink.searchParams.set("connection", "email");
    magicLink.searchParams.set("client_id", loginState.authParams.client_id);
    magicLink.searchParams.set("email", loginState.authParams.username);
    magicLink.searchParams.set("verification_code", code);

    await sendLink(env, client, params.username, code, magicLink.href);

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
    const loginState = await getLoginState(env, state);

    return renderEnterCode(env.AUTH_TEMPLATES, this, loginState);
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
    const loginState = await getLoginState(env, state);

    if (!loginState.authParams.username) {
      throw new Error("username required in state");
    }

    const client = await getClient(env, loginState.authParams.client_id);

    try {
      // this is duplicated from passwordless/verify_redirect
      // previously we had all this code inside the User Model
      // should we extract it out into a helper function?
    } catch (err) {
      return renderEnterCode(env.AUTH_TEMPLATES, this, {
        ...loginState,
        errorMessage: "Invalid code",
      });
    }

    return renderMessage(env.AUTH_TEMPLATES, this, {
      ...loginState,
      page_title: "Logged in",
      message: "You are logged in",
    });
  }

  /**
   * Validates a code entered in the validate-email form
   * @param request
   */
  @Post("validate-email")
  public async postValidateEmail(
    @Request() request: RequestWithContext,
    @Body() params: { code: string },
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const loginState = await getLoginState(env, state);

    const email = loginState.authParams.username;
    if (!email) {
      throw new InvalidRequestError("Username not found in state");
    }

    const client = await getClient(env, loginState.authParams.client_id);

    try {
      // another duplicate here - DRY rule of three!
      const otps = await env.data.OTP.list(client.tenant_id, email);
      const otp = otps.find((otp) => otp.code === params.code);

      if (!otp) {
        return renderEnterCode(env.AUTH_TEMPLATES, this, {
          ...loginState,
          errorMessage: "Code not found or expired",
        });
      }

      let user = await env.data.users.getByEmail(client.tenant_id, email);
      if (!user) {
        throw new Error("Something wrong with our implementation!");
      }

      const profile: Profile = {
        id: user.id,
        name: user.name,
        email: user.email,
        connections: [],
        tenant_id: client.tenant_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return handleLogin(env, this, profile, loginState);
    } catch (err: any) {
      return renderEmailValidation(env.AUTH_TEMPLATES, this, {
        ...loginState,
        errorMessage: err.message,
      });
    }
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
    const loginState = await getLoginState(env, state);

    return renderSignup(env.AUTH_TEMPLATES, this, loginState);
  }

  @Post("signup")
  public async postSignup(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const loginState = await getLoginState(env, state);

    const client = await getClient(env, loginState.authParams.client_id);

    if (loginState.authParams.username !== loginParams.username) {
      loginState.authParams.username = loginParams.username;
      await setLoginState(env, state, loginState);
    }

    try {
      // I don't think this is used on any public facing routes so far
      await env.data.passwords.create(client.tenant_id, {
        user_id: loginParams.username,
        password: loginParams.password,
      });

      // are we safe to put these logs in?
      // await env.data.logs.create({
      //   category: "login",
      //   message: "User created with password",
      //   tenant_id,
      //   user_id: id,
      // });

      const code = generateOTP();

      await env.data.OTP.create({
        id: nanoid(),
        code,
        // is this a reasonable assumption?
        email: loginParams.username,
        client_id: loginState.authParams.client_id,
        send: "code",
        authParams: loginState.authParams,
        tenant_id: client.tenant_id,
        created_at: new Date(),
        expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
      });

      request.ctx.set("log", `Code: ${code}`);

      // await env.data.logs.create({
      //   category: "login",
      //   message: "Create email validation code",
      //   tenant_id,
      //   user_id: id,
      // });
      await sendEmailValidation(env, client, loginParams.username, code);

      if (client.email_validation === "enforced") {
        // Update the username in the state
        await setLoginState(env, state, {
          ...loginState,
          authParams: {
            ...loginState.authParams,
            username: loginParams.username,
          },
        });

        return renderEmailValidation(env.AUTH_TEMPLATES, this, loginState);
      }

      let user = await env.data.users.getByEmail(
        client.tenant_id,
        loginParams.username,
      );
      if (!user) {
        throw new Error("Something wrong with our implementation!");
      }

      const profile: Profile = {
        id: loginParams.username,
        email: loginParams.username,
        connections: [],
        tenant_id: client.tenant_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return handleLogin(env, this, profile, loginState);
    } catch (err: any) {
      return renderSignup(env.AUTH_TEMPLATES, this, {
        ...loginState,
        errorMessage: err.message,
      });
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
    const loginState = await getLoginState(env, state);

    return renderForgotPassword(env.AUTH_TEMPLATES, this, {
      ...loginState,
      state,
    });
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

    const loginState = await getLoginState(env, state);
    const { client_id } = loginState.authParams;

    const client = await getClient(env, client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    if (loginState.authParams.username !== params.username) {
      loginState.authParams.username = params.username;
      await setLoginState(env, state, loginState);
    }

    const code = generateOTP();

    await env.data.OTP.create({
      id: nanoid(),
      code,
      // I'm doing this everyhwere!
      email: params.username,
      client_id: loginState.authParams.client_id,
      send: "code",
      authParams: loginState.authParams,
      tenant_id: client.tenant_id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
    });

    request.ctx.set("log", `Code: ${code}`);

    // await env.data.logs.create({
    //   category: "login",
    //   message: "Send password reset",
    //   tenant_id,
    //   user_id: id,
    // });

    await sendResetPassword(env, client, params.username, code, state);

    return renderMessage(env.AUTH_TEMPLATES, this, {
      ...loginState,
      page_title: "Password reset",
      message: "A code has been sent to your email address",
    });
  }

  /**
   * Renders a reset password form
   * @param request
   */
  @Get("reset-password")
  public async getResetPassword(
    @Request() request: RequestWithContext,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const loginState = await getLoginState(env, state);

    return renderResetPassword(env.AUTH_TEMPLATES, this, loginState);
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
    const loginState = await getLoginState(env, state);

    if (!loginState.authParams.username) {
      throw new InvalidRequestError("Username required");
    }

    const client = await getClient(env, loginState.authParams.client_id);

    const user = env.userFactory.getInstanceByName(
      getId(client.tenant_id, loginState.authParams.username),
    );

    throw new Error("Not implemented");

    // try {
    //   const profile = await user.resetPasswordWithCode.mutate({
    //     code,
    //     password: params.password,
    //   });

    //   const { tenant_id, id } = profile;
    //   await env.data.logs.create({
    //     category: "update",
    //     message: "Reset password with code",
    //     tenant_id,
    //     user_id: id,
    //   });
    // } catch (err) {
    //   return renderResetPassword(env.AUTH_TEMPLATES, this, {
    //     ...loginState,
    //     state,
    //     errorMessage: "Invalid code",
    //   });
    // }

    // return renderMessage(env.AUTH_TEMPLATES, this, {
    //   ...loginState,
    //   page_title: "Password reset",
    //   message: "The password has been reset",
    // });
  }

  @Post("login")
  public async postLogin(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string,
  ): Promise<string> {
    const { env } = request.ctx;
    const loginState = await getLoginState(env, state);

    const client = await getClient(env, loginState.authParams.client_id);

    const user = env.userFactory.getInstanceByName(
      getId(client.tenant_id, loginParams.username),
    );

    throw new Error("Not implemented");

    // try {
    //   await user.validatePassword.mutate({
    //     password: loginParams.password,
    //     tenantId: client.tenant_id,
    //     email: loginParams.username,
    //   });
    //   const profile = await user.getProfile.query();

    //   const { tenant_id, id } = profile;
    //   await env.data.logs.create({
    //     category: "login",
    //     message: "Login with password",
    //     tenant_id,
    //     user_id: id,
    //   });

    //   const authConnection = profile.connections.find((c) => c.name === "auth");
    //   if (
    //     !authConnection?.profile?.validated &&
    //     client.email_validation === "enforced"
    //   ) {
    //     // Update the username in the state
    //     await setLoginState(env, state, {
    //       ...loginState,
    //       authParams: {
    //         ...loginState.authParams,
    //         username: loginParams.username,
    //       },
    //     });

    //     const { code } = await user.createEmailValidationCode.mutate();
    //     const userProfile = await user.getProfile.query();
    //     const { tenant_id, id } = userProfile;
    //     await env.data.logs.create({
    //       category: "login",
    //       message: "Create email validation code",
    //       tenant_id,
    //       user_id: id,
    //     });
    //     await sendEmailValidation(env, client, profile.email, code);

    //     return renderEmailValidation(env.AUTH_TEMPLATES, this, loginState);
    //   }

    //   return handleLogin(env, this, profile, loginState);
    // } catch (err: any) {
    //   return renderLogin(env.AUTH_TEMPLATES, this, {
    //     ...loginState,
    //     errorMessage: err.message,
    //     state,
    //   });
    // }
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

    const stateInstance = env.stateFactory.getInstanceById(base64ToHex(code));
    const stateString = await stateInstance.getState.query();
    if (!stateString) {
      throw new Error("Code not found");
    }

    const stateObj: { userId: string; user: Profile; authParams: AuthParams } =
      JSON.parse(stateString);
    const userProfile = stateObj.user;

    return renderMessage(env.AUTH_TEMPLATES, this, {
      page_title: "User info",
      message: `Welcome ${userProfile?.name || userProfile.email}`,
    });
  }
}
