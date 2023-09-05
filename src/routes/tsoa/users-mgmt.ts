// not sure what to call this, or where to place it! 8-)
import {
  Controller,
  Get,
  Request,
  Route,
  Tags,
  Path,
  Header,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";

@Route("api/v2")
@Tags("users-mgmt") // what is tags?
// TODO - need security!
// @Security("oauth2managementApi", [""])
export class UsersMgmtController extends Controller {
  @Get("users/{userId}")
  public async getUser(
    @Request() request: RequestWithContext,
    @Path("userId") userId: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { ctx } = request;
    const { env } = ctx;

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

  // "https://auth2.sesamy.dev/api/v2/users-by-email?email=dan%2B456%40sesamy.com",
  //
}
