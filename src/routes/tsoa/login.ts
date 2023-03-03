import {
  Controller,
  Get,
  Post,
  Patch,
  Request,
  Route,
  Tags,
  Body,
  Path,
  Query,
} from "@tsoa/runtime";
import { Env } from "../../types/Env";
import { Liquid, Template } from "liquidjs";

const engine = new Liquid();

import { RequestWithContext } from "../../types/RequestWithContext";

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
    @Query("username") username?: string
  ): Promise<string> {
    const template = await getTemplate(request.ctx.env.AUTH_TEMPLATES, "login");

    if (!template) {
      return "Not Found";
    }

    this.setHeader("content-type", "text/html");
    this.setStatus(200);

    return engine.render(template, { username });
  }

  @Post("login")
  public async postLogin(
    @Request() request: RequestWithContext,
    @Body() loginParams: LoginParams
  ): Promise<string> {
    console.log(JSON.stringify(loginParams));

    const template = await request.ctx.env.AUTH_TEMPLATES.get(
      "templates/login.html"
    );

    if (!template) {
      return "Not Found";
    }

    this.setHeader("content-type", "text/html");
    this.setStatus(200);
    const body = await template.text();

    return body;
  }
}
