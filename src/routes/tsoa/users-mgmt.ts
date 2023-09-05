// not sure what to call this, or where to place it! 8-)
import { Controller, Get, Request, Route, Tags, Path } from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";

@Route("api/v2/users")
// @Security("oauth2managementApi", [""])
@Tags("users-mgmt") // what is tags?
export class UsersController extends Controller {
  @Get("{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    // ): Promise<Profile> {
  ): Promise<string> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      // we do not get sent a tenant id
      // .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    // Fetch the user from durable object
    // const user = env.userFactory.getInstanceByName(
    //   getId(tenantId, dbUser.email),
    // );

    // return user.getProfile.query();

    return "success";
  }
}
