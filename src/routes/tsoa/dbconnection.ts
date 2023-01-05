// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "tsoa-workers";
import { RequestWithContext } from "../../types/RequestWithContext";
import UserClient from "../../models/UserClient";
import { RegisterParams } from "../../types/IUser";

export interface PassswordOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send?: "link" | "code";
}

@Route("dbconnection")
@Tags("dbconnection")
export class DbConnectionController extends Controller {
  @Post("register")
  public async registerUser(
    @Body() body: RegisterParams,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = new UserClient(ctx, body.email);
    const response = await user.register(body);

    if (response.ok) {
      return "Created";
    }
    this.setStatus(response.code || 500);
    return response.message || "Failed";
  }
}
