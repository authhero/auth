// not sure what to call this, or where to place it! 8-)
import { Controller, Get, Request, Route, Tags, Path } from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";

@Route("api/v2/users")
@Tags("users-mgmt") // what is tags?
// TODO - need security!
// @Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

    // get tenantId from header tenant-id
    const tenantId = request.headers["tenant-id"];
    // headers is of type any! 8-0  - can I fix this?
    // should be string | string[] | undefined - like Nextjs

    if (!tenantId) throw new Error("tenant-id header is required");

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenantId", "=", tenantId)
      .where("users.id", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    const userResult = user.getProfile.query();

    return userResult;
  }
}
