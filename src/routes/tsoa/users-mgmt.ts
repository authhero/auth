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
    // not actually hitting this! is already 404ing... not getting any log
    console.log("in getUser");
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
      console.log("no dbUser");
      throw new NotFoundError();
    }

    // I can find the user by querying the planetscale database
    // but I need to suffix breakit id for durable object?
    const tenantId = "JTnV3E4M59SpxiIhhXf6s";

    console.log("dbUser", dbUser);
    // Fetch the user from durable object
    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
      // userId,
    );

    // Invalid Durable Object ID. Durable Object IDs must be 64 hex digits.
    // const user = env.userFactory.getInstanceById(userId);

    console.log("user", user);

    const userResult = user.getProfile.query();

    console.log("userResult", userResult);

    return userResult;

    // return "success";

    // return dbUser.email;
  }
}
