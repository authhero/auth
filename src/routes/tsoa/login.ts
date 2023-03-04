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
import { Env } from "../../types/Env";
import { Liquid, Template } from "liquidjs";

const engine = new Liquid();

import { RequestWithContext } from "../../types/RequestWithContext";
import { getId, User } from "../../models/User";
import { LoginState } from "../../types/LoginState";
import { decode } from "../../utils/base64";

export interface LoginParams {
  username: string;
  password: string;
}

async function getTemplate(bucket: R2Bucket, templateName: string) {
  let response = await bucket.get(`templates/${templateName}.liquid`);

  if (!response) {
    throw new Error("Template not found");
  }

  const templateString = await response.text();

  return engine.parse(templateString);
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
    const loginState: LoginState = JSON.parse(atob(state));

    const template = await getTemplate(request.ctx.env.AUTH_TEMPLATES, "login");

    if (!template) {
      return "Not Found";
    }

    this.setHeader("content-type", "text/html");
    this.setStatus(200);

    return engine.render(template, { ...loginState, state });
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
    const loginState: LoginState = JSON.parse(atob(state));

    const template = await getTemplate(
      request.ctx.env.AUTH_TEMPLATES,
      "signup"
    );

    if (!template) {
      return "Not Found";
    }

    this.setHeader("content-type", "text/html");
    this.setStatus(200);

    return engine.render(template, { ...loginState, state });
  }

  @Post("signup")
  public async postSignup(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string
  ): Promise<string> {
    const loginState: LoginState = JSON.parse(decode(state));

    const user = User.getInstance(
      request.ctx.env.USER,
      getId(loginState.clientId, loginParams.username)
    );

    await user.register.query(loginParams.password);

    // TODO: either validate email or pass user on
    return "User registered";
  }

  @Post("login")
  public async postLogin(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams,
    @Query("state") state: string
  ): Promise<string> {
    const loginState: LoginState = JSON.parse(decode(state));

    const user = User.getInstance(
      request.ctx.env.USER,
      getId(loginState.clientId, loginParams.username)
    );

    const validPassword = await user.validatePassword.query(
      loginParams.password
    );

    if (validPassword) {
      return "TODO: Redirect with code or token";
    }

    const template = await getTemplate(request.ctx.env.AUTH_TEMPLATES, "login");

    if (!template) {
      return "Not Found";
    }

    this.setHeader("content-type", "text/html");
    this.setStatus(200);

    return engine.render(template, {
      ...loginState,
      state,
      username: loginParams.username,
      errorMessage: "Invalid Password",
    });
  }
}
