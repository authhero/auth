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
    // This should be ResponseUser!  8-)
    const { env } = request.ctx;

    const users = await env.data.users.getByEmail(tenant_id, email);
    if (users.length === 0) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // We could do defensive coding here and alert if we have multiple primary users...
    const primarySqlUser = users.find((user) => !user.linked_to);

    if (!primarySqlUser) {
      // seems a 500 as we've messed something up here!
      throw new HTTPException(500, { message: "No primary user" });
    }

    // Step 1 - return this user in array
    // Step 2 - return all users with this email address
    // Step 3- filter out linked users e.g. linked_to field is populated
    // Step 4 - return nested identities
    // don't overthink this last step. copy-paste but have tests so can TDD

    const userResponse: UserResponse = await enrichUser(
      env,
      tenant_id,
      primarySqlUser,
    );

    // This is assuming we'll only have one user returned
    // but if we return multiple users, we'll need to do this mapping for each
    // BUT in our use case this is most likely a bug!
    // --------
    // TODO - need to map through all users with linked_to as NULL
    return [userResponse];
  }
}
