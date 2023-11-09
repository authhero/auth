// src/users/usersController.ts
import {
  Body,
  Controller,
  Post,
  Request,
  Route,
  Tags,
  Path,
  SuccessResponse,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { InvalidRequestError } from "../../errors";
import { HTTPException } from "hono/http-exception";
import { getId, User } from "../../models/User";
import { getClient } from "../../services/clients";
import sendEmail from "../../services/email";

export interface RegisterUserParams {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send?: "link" | "code";
}

export interface ResetPasswordParams {
  client_id?: string;
  connection: string;
  email: string;
}

export interface VerifyEmailParams {
  client_id?: string;
  code: string;
  email: string;
}

export interface RegisterParams {
  email: string;
  password: string;
}

@Route("{clientId}/dbconnection")
@Tags("dbconnection")
export class DbConnectionController extends Controller {
  @Post("register")
  @SuccessResponse(201, "Created")
  public async registerUser(
    @Body() body: RegisterParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    const { ctx } = request;

    const client = await ctx.env.data.clients.get(clientId);

    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    // Ensure the user exists
    let user = await ctx.env.data.users.getByEmail(
      client.tenant_id,
      body.email,
    );
    if (!user) {
      user = await ctx.env.data.users.create(client.tenant_id, {
        email: body.email,
        tenant_id: client.tenant_id,
        // what should happen here then? should this in SQL?
        // email_verified: false,
      });
    }

    // Store the password
    await ctx.env.data.passwords.create(client.tenant_id, {
      user_id: user.id,
      password: body.password,
    });

    this.setStatus(201);
    await ctx.env.data.logs.create({
      category: "login",
      message: "User created with password",
      tenant_id: client.tenant_id,
      user_id: user.id,
    });
    return "OK";
  }

  @Post("reset_password")
  public async resetPassword(
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    throw new Error("Not implemented");

    // await env.data.logs.create({
    //   category: "login",
    //   message: "Send password reset",
    //   tenant_id,
    //   user_id: id,
    // });
  }

  @Post("verify_email")
  public async verifyEmail(
    @Body() body: VerifyEmailParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    throw new Error("Not implemented");

    // await ctx.env.data.logs.create({
    //   category: "validation",
    //   message: "Validate with code",
    //   tenant_id,
    //   user_id: id,
    // });
  }
}
