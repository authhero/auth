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
import { base64ToHex, decode, encode } from "../../utils/base64";
import { getClient } from "../../services/clients";
import {
  renderMessage,
  renderForgotPassword,
  renderResetPassword,
  renderSignup,
  renderLogin,
} from "../../templates/render";
import { AuthParams } from "../../types";

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
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const loginState: LoginState = JSON.parse(decode(state));

    return renderLogin(ctx.env.AUTH_TEMPLATES, this, loginState);
  }

  /**
   * Renders a signup user form
   * @param request
   */
  @Get("signup")
  public async getSignup(
    @Request() request: RequestWithContext,
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const loginState: LoginState = JSON.parse(decode(state));

    return renderSignup(ctx.env.AUTH_TEMPLATES, this, {
      client_id: loginState.authParams.client_id,
      state,
    });
  }

  @Post("signup")
  public async postSignup(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const loginState: LoginState = JSON.parse(decode(state));

    const client = await getClient(ctx.env, loginState.authParams.client_id);
    const user = ctx.env.userFactory.getInstanceByName(
      getId(client.tenantId, loginParams.username)
    );

    try {
      await user.registerPassword.mutate(loginParams.password);
    } catch (err: any) {
      const signupState = encode(
        JSON.stringify({
          username: loginParams.username,
          clientId: loginState.authParams.client_id,
        })
      );

      return renderSignup(ctx.env.AUTH_TEMPLATES, this, {
        client_id: loginState.authParams.client_id,
        username: loginParams.username,
        errorMessage: err.message,
        state: signupState,
      });
    }

    return renderMessage(ctx.env.AUTH_TEMPLATES, this, {
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
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const loginState = JSON.parse(atob(state));

    return renderForgotPassword(ctx.env.AUTH_TEMPLATES, this, {
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
    @Query("state") state: string
  ): Promise<string> {
    const { env } = request.ctx;

    const loginState: LoginState = JSON.parse(decode(state));
    const { client_id } = loginState.authParams;

    const client = await getClient(env, client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      getId(client.tenantId, params.username)
    );
    const { code } = await user.createPasswordResetCode.mutate();

    const passwordResetState = encode(
      JSON.stringify({
        username: params.username,
        client_id,
        code,
      })
    );

    const message = `Click this link to reset your password: ${env.AUTH_DOMAIN_URL}u/reset-password?state=${passwordResetState}`;
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
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const resetPasswordState: ResetPasswordState = JSON.parse(decode(state));

    return renderResetPassword(ctx.env.AUTH_TEMPLATES, this, {
      ...resetPasswordState,
      state,
    });
  }

  /**
   * Renders a reset password form
   * @param request
   */
  @Post("reset-password")
  public async postResetPassword(
    @Request() request: RequestWithContext,
    @Body() params: { password: string },
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const resetPasswordState: ResetPasswordState = JSON.parse(decode(state));

    const user = ctx.env.userFactory.getInstanceByName(
      getId(resetPasswordState.client_id, resetPasswordState.username)
    );

    if (
      !(await user.validatePasswordResetCode.query(resetPasswordState.code))
    ) {
      return renderResetPassword(ctx.env.AUTH_TEMPLATES, this, {
        ...resetPasswordState,
        state,
        errorMessage: "Invalid code",
      });
    }

    return renderMessage(ctx.env.AUTH_TEMPLATES, this, {
      page_title: "Password reset",
      message: "The password has been reset",
    });
  }

  @Post("login")
  public async postLogin(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string
  ): Promise<string> {
    const { ctx } = request;
    const loginState: LoginState = JSON.parse(decode(state));

    const client = await getClient(ctx.env, loginState.authParams.client_id);

    const user = ctx.env.userFactory.getInstanceByName(
      getId(client.tenantId, loginParams.username)
    );

    try {
      await user.validatePassword.query(loginParams.password);

      return renderMessage(ctx.env.AUTH_TEMPLATES, this, {
        page_title: "Logged in",
        message: "You are logged in",
      });
    } catch (err: any) {
      return renderLogin(ctx.env.AUTH_TEMPLATES, this, {
        authParams: loginState.authParams,
        username: loginParams.username,
        errorMessage: err.message,
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
    @Query("code") code: string
  ): Promise<string> {
    const { ctx } = request;

    const stateInstance = ctx.env.stateFactory.getInstanceById(
      base64ToHex(code)
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
