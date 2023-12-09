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

async function enrichUser(
  env: Env,
  tenantId: string,
  primaryUser: User,
): Promise<UserResponse> {
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

    const primarySqlUsers = users.filter((user) => !user.linked_to);

    if (primarySqlUsers.length === 0) {
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
