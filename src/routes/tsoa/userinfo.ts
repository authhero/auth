import { Controller, Get, Request, Route, Security, Tags } from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getDb } from "../../services/db";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";

@Route("")
@Tags("userinfo")
export class UserinfoController extends Controller {
  @Get("userinfo")
  @Security("oauth2", ["openid profile"])
  public async getUser(
    @Request() request: RequestWithContext,
  ): Promise<{ id: string }> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.id", "=", ctx.state.user.sub)
      .selectAll()
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    // Fetch the user from durable object
    const user = env.userFactory.getInstanceByName(
      getId(dbUser.tenantId, dbUser.email),
    );

    return user.getProfile.query();
  }
}
