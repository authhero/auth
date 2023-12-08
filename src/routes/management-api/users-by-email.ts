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
import { RequestWithContext } from "../../types/RequestWithContext";
import { HTTPException } from "hono/http-exception";
import { UserResponse } from "../../types/auth0/UserResponse";
import userIdParse from "../../utils/userIdParse";
import { Env, User } from "../../types";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

// Who knows what this should be called?
// let's get this working and then extract out common code
async function enrichUser(
  env: Env,
  tenantId: string,
  primaryUser: User,
): Promise<UserResponse> {
  // lots of this code is copied from the GET route. I'll TDD this first
  // and code whatever

  // I had assumed that we would already have all the linked users
  // by searching by email BUT Markus is correct   8-)
  // anything can be linked to anything
  const linkedusers = await env.data.users.list(tenantId, {
    page: 0,
    per_page: 10,
    include_totals: false,
    q: `linked_to:${primaryUser.id}`,
  });

  const identities = [primaryUser, ...linkedusers.users].map((u) => ({
    connection: u.connection,
    provider: u.provider,
    user_id: userIdParse(u.id),
    isSocial: u.is_social,
    // TODO - have profileData PR that needs continuing...
  }));

  const { id, ...userWithoutId } = primaryUser;

  return {
    ...userWithoutId,
    identities,
    user_id: primaryUser.id,
  };
}

@Route("api/v2/users-by-email")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersByEmailController extends Controller {
  @Get("")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") email: string,
    @Header("tenant-id") tenant_id: string,
  ): Promise<UserResponse[]> {
    const { env } = request.ctx;

    const users = await env.data.users.getByEmail(tenant_id, email);
    if (users.length === 0) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // We could do defensive coding here and alert if we have multiple primary users...
    const primarySqlUsers = users.filter((user) => !user.linked_to);

    if (primarySqlUsers.length === 0) {
      // don't return secondary accounts
      this.setStatus(404);
      return [];
    }

    const response: UserResponse[] = await Promise.all(
      primarySqlUsers.map(async (primarySqlUser) => {
        return await enrichUser(env, tenant_id, primarySqlUser);
      }),
    );
    return response;
  }
}
