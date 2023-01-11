// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Request,
  Route,
  Security,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";

export interface PasssworlessOptions {
  client_id: string;
  client_secret?: string;
  connection: "email";
  email: string;
  send?: "link" | "code";
  authParams?: {
    redirect_uri?: string;
    scope?: string;
  };
}

@Route("")
@Tags("userinfo")
export class PasswordlessController extends Controller {
  @Get("userinfo")
  @Security("oauth2", ["openid profile"])
  public async getUser(
    @Request() request: RequestWithContext
  ): Promise<{ id: string }> {
    const { ctx } = request;

    return {
      id: ctx.state.user.sub,
    };
  }
}
