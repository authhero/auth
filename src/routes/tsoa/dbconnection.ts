// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import UserClient from "../../models/UserClient";
import { RegisterParams } from "../../types/IUser";
import sendEmail from "../../services/email";
import { client } from "../../constants";

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

  @Post("reset_password")
  public async resetPassword(
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = new UserClient(ctx, body.email);
    const { code } = await user.createCode();

    const message = `Click this link to reset your password: ${client.loginBaseUrl}/reset-password?email=${body.email}&code=${code}`;
    await sendEmail({
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
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = new UserClient(ctx, body.email);
    const { code } = await user.createCode();

    const message = `Click this link to verify your email: ${client.loginBaseUrl}/verify-email?email=${body.email}&code=${code}`;
    await sendEmail({
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
      subject: "Verify email",
    });

    return "ok";
  }
}
