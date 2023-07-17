import { Controller, Get, Request, Route, Security, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";

@Route("")
@Tags("userinfo")
export class UserinfoController extends Controller {
  @Get("userinfo")
  @Security("oauth2", ["openid profile"])
  public async getUser(
    @Request() request: RequestWithContext,
  ): Promise<{ id: string }> {
    const { ctx } = request;

    return {
      id: ctx.state.user.sub,
    };
  }
}
