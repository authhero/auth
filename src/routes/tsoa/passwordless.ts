// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "tsoa-workers";
import sendEmail from "../../services/email";
import { RequestWithContext } from "../../types/RequestWithContext";
import UserClient from "../../models/UserClient";
import { client } from "../../constants";

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

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("start")
  public async getUser(
    @Body() body: PasssworlessOptions,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { ctx } = request;

    const user = new UserClient(ctx, body.email);
    const { code } = await user.createCode();

    const message = `Here's your login code: ${code}`;
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
      subject: "Login code",
    });

    return "ok";
  }
}
