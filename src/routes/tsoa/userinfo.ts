import { Controller, Get, Request, Route, Security, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { User } from "../../types";
import { HTTPException } from "hono/http-exception";

@Route("")
@Tags("userinfo")
export class UserinfoController extends Controller {
  @Get("userinfo")
  @Security("oauth2", ["openid profile"])
  public async getUser(@Request() request: RequestWithContext): Promise<User> {
    const { ctx } = request;
    const { env } = ctx;

    if (!ctx.var.user) {
      throw new HTTPException(403, { message: "Unauthorized" });
    }
    if (!ctx.var.userId) {
      throw new HTTPException(403, { message: "Unauthorized" });
    }

    const user = await env.data.users.get(ctx.var.user.azp, ctx.var.userId);
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return user;
  }
}
