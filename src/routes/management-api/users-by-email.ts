import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  Header,
  Security,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { getId } from "../../models";
import { Profile } from "../../types";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2/users-by-email")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersByEmailController extends Controller {
  @Get("")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") userEmail: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<Profile> {
    const { env } = request.ctx;

    const db = getDb(env);
    const dbUser = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", userEmail)
      .select("users.email")
      .executeTakeFirst();

    if (!dbUser) {
      throw new NotFoundError();
    }

    const user = env.userFactory.getInstanceByName(
      getId(tenantId, dbUser.email),
    );

    return user.getProfile.query();
  }
}
