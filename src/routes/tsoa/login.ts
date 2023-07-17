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
} from "../../templates/render";
import { AuthParams, Env } from "../../types";
import { InvalidRequestError } from "../../errors";
import { headers } from "../../constants";

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
   * Renders a code login form
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
    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, params.username),
    );

    const { code } = await user.createAuthenticationCode.mutate(loginState);

    // Add the usernmane to the state
    loginState.authParams.username = params.username;
    await setLoginState(env, state, loginState);

    const message = `Here is your login code: ${code}`;
    await env.sendEmail({
      to: [{ email: params.username, name: "" }],
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
      subject: "Login Code",
    });

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
    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, loginState.authParams.username),
    );

    try {
      await user.validateAuthenticationCode.mutate({
        code: params.code,
        email: loginState.authParams.username,
        tenantId: client.tenantId,
      });
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
    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, loginParams.username),
    );

    if (loginState.authParams.username !== loginParams.username) {
      loginState.authParams.username = loginParams.username;
      await setLoginState(env, state, loginState);
    }

    try {
      await user.registerPassword.mutate(loginParams.password);
    } catch (err: any) {
      return renderSignup(env.AUTH_TEMPLATES, this, {
        ...loginState,
        errorMessage: err.message,
      });
    }

    return renderMessage(env.AUTH_TEMPLATES, this, {
      ...loginState,
      page_title: "User created",
      message: "Your user has been created",
    });
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

    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, params.username),
    );

    if (loginState.authParams.username !== params.username) {
      loginState.authParams.username = params.username;
      await setLoginState(env, state, loginState);
    }

    const { code } = await user.createPasswordResetCode.mutate();

    const message = `Click this link to reset your password: ${env.ISSUER}u / reset - password ? state = ${state} & code=${code}`;
    await env.sendEmail({
      to: [{ email: params.username, name: "" }],
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
      subject: "Reset password",
    });

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
      getId(client.tenantId, loginState.authParams.username),
    );

    try {
      await user.resetPasswordWithCode.mutate({
        code,
        password: params.password,
      });
    } catch (err) {
      return renderResetPassword(env.AUTH_TEMPLATES, this, {
        ...loginState,
        state,
        errorMessage: "Invalid code",
      });
    }

    return renderMessage(env.AUTH_TEMPLATES, this, {
      ...loginState,
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
    const loginState = await getLoginState(env, state);

    const client = await getClient(env, loginState.authParams.client_id);

    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, loginParams.username),
    );

    try {
      await user.validatePassword.mutate({
        password: loginParams.password,
        tenantId: client.tenantId,
        email: loginParams.username,
      });

      return renderMessage(env.AUTH_TEMPLATES, this, {
        ...loginState,
        page_title: "Logged in",
        message: "You are logged in",
      });
    } catch (err: any) {
      return renderLogin(env.AUTH_TEMPLATES, this, {
        ...loginState,
        errorMessage: err.message,
        state,
      });
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
    const { ctx } = request;

    const stateInstance = ctx.env.stateFactory.getInstanceById(
      base64ToHex(code),
    );
    const stateString = await stateInstance.getState.query();
    if (!stateString) {
      throw new Error("Code not found");
    }

    const stateObj: { userId: string; authParams: AuthParams } =
      JSON.parse(stateString);

    const userInstance = ctx.env.userFactory.getInstanceByName(stateObj.userId);
    const userProfile = await userInstance.getProfile.query();

    return renderMessage(ctx.env.AUTH_TEMPLATES, this, {
      page_title: "User info",
      message: `Welcome ${userProfile?.name}`,
    });
  }
}
