// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Tags } from "tsoa-workers";
import { nanoid } from "nanoid";
import sendEmail from "../../services/email";
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

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("start")
  public async getUser(
    @Body() body: PasssworlessOptions,
    @Request() request: RequestWithContext
  ): Promise<string> {
    const { env } = request.ctx;

    const code = nanoid();

    const id = env.USER.idFromName(body.email);
    const obj = request.ctx.env.USER.get(id);
    const response = await obj.fetch(request.ctx.request.url, {
      method: "PUT",
      body: JSON.stringify({
        code,
        token: "dummy token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to persist code");
    }

    await sendEmail({
      to: [{ email: body.email, name: "" }],
      from: {
        email: "markus@sesamy.com",
        name: "Markus Test",
      },
      content: [
        {
          type: "text/plain",
          value: `Here's your login code: ${code}`,
        },
      ],
      subject: "Login code",
    });

    return "ok";
  }
}
