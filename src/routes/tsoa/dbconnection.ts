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
import { getId, User } from "../../models/User";
import { getClient } from "../../services/clients";
import { InvalidRequestError } from "../../errors";

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
      throw new InvalidRequestError("Client not found");
    }

    // Ensure the user exists
    let user = await ctx.env.data.users.getByEmail(
      client.tenant_id,
      body.email,
    );
    if (!user) {
      user = await ctx.env.data.users.create(client.tenant_id, {
        email: body.email,
        email_verified: false,
      });
    }

    // Store the password
    await ctx.env.data.passwords.create(client.tenant_id, {
      user_id: user.id,
      password: body.password,
    });

    this.setStatus(201);
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

    const client = await getClient(env, clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const message = `Click this link to reset your password: ${env.ISSUER}u/reset-password?email=${body.email}&code=${code}`;

    await env.sendEmail({
      to: [{ email: body.email, name: "" }],
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
    await user.validateEmailValidationCode.query(body.code);

    return "ok";
  }
}
