// src/users/usersController.ts
import {
  Body,
  Controller,
  Post,
  Request,
  Route,
  Tags,
  Path,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
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
  public async registerUser(
    @Body() body: RegisterParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    const { ctx } = request;

    const client = await getClient(ctx.env, clientId);

    const user = User.getInstanceByName(
      ctx.env.USER,
      getId(client.tenant_id, body.email),
    );
    const profile = await user.registerPassword.mutate({
      password: body.password,
      email: body.email,
      tenantId: client.tenant_id,
    });

    const { tenant_id, id } = profile;
    await ctx.env.data.logs.create({
      category: "login",
      message: "User created with password",
      tenant_id,
      user_id: id,
    });

    return "OK";
  }

  @Post("reset_password")
  public async resetPassword(
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const user = User.getInstanceByName(env.USER, getId(clientId, body.email));
    const { code } = await user.createPasswordResetCode.mutate();
    const userProfile = await user.getProfile.query();
    const { tenant_id, id } = userProfile;
    await env.data.logs.create({
      category: "login",
      message: "Send password reset",
      tenant_id,
      user_id: id,
    });

    const client = await getClient(env, clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const message = `Click this link to reset your password: ${env.ISSUER}u/reset-password?email=${body.email}&code=${code}`;

    await sendEmail(client, {
      to: [{ email: body.email, name: "" }],
      from: {
        email: client.tenant.sender_email,
        name: client.tenant.sender_name,
      },
      content: [
        {
          type: "text/plain",
          value: message,
        },
      ],
      subject: "Reset password",
    });

    return "ok";
  }

  @Post("verify_email")
  public async verifyEmail(
    @Body() body: VerifyEmailParams,
    @Request() request: RequestWithContext,
    @Path("clientId") clientId: string,
  ): Promise<string> {
    const { ctx } = request;

    const user = User.getInstanceByName(
      ctx.env.USER,
      getId(clientId, body.email),
    );
    const client = await getClient(ctx.env, clientId);

    const profile = await user.validateEmailValidationCode.mutate({
      code: body.code,
      email: body.email,
      tenantId: client.tenant_id,
    });

    const { tenant_id, id } = profile;
    await ctx.env.data.logs.create({
      category: "validation",
      message: "Validate with code",
      tenant_id,
      user_id: id,
    });

    return "ok";
  }
}
