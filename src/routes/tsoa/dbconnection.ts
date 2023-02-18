// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { User } from "../../models/User";
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

export interface VerifyEmailParams {
  client_id?: string;
  code: string;
  email: string;
}

export interface RegisterParams {
  email: string;
  password: string;
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

    const user = User.getInstance(ctx.env.USER, body.email);
    await user.register.query(body.password);

    return "OK";
  }

  @Post("reset_password")
  public async resetPassword(
    @Body() body: ResetPasswordParams,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = User.getInstance(ctx.env.USER, body.email);
    const { code } = await user.createCode.query();

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
    @Body() body: VerifyEmailParams,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = User.getInstance(ctx.env.USER, body.email);
    const { code } = await user.verfifyCode.query(body.code);

    return "ok";
  }
}
