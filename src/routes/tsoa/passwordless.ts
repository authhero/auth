// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "@tsoa/runtime";
import sendEmail from "../../services/email";
import { RequestWithContext } from "../../types/RequestWithContext";
import { User } from "../../models/User";
import { getClient } from "../../services/clients";

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

    const user = User.getInstance(ctx.env.USER, body.email);
    const { code } = await user.createAuthenticationCode.mutate();

    const client = await getClient(ctx, body.client_id);

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
